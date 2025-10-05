import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomLoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { TenantsService } from '../tenants/tenants.service';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private blacklistedTokens = new Set<string>(); // In production, use Redis or database

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: CustomLoggerService,
    private permissionsService: PermissionsService,
    private tenantsService: TenantsService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.refreshTokenExpiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '1h';
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, roleId, tenantId } = registerDto;

    // Validate tenant exists and is active
    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is not active');
    }

    // Check if user already exists in this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: { 
        email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    // Validate role exists
    const role = await this.prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new BadRequestException('Invalid role ID');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with encrypted password
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        roleId,
        tenantId,
        password: hashedPassword,
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    // Generate tokens
    const payload = { 
      sub: user.id, 
      email: user.email, 
      roleId: user.roleId,
      tenantId: user.tenantId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    // Store refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`User registered successfully: ${user.email} in tenant: ${tenant.name}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, tenant } = loginDto;

    let tenantId: string | undefined;
    let tenantEntity: any = null;

    // If tenant is provided, resolve it
    if (tenant) {
      try {
        // Check if it's a tenant ID or subdomain
        if (tenant.startsWith('c') && tenant.length > 20) {
          tenantEntity = await this.tenantsService.findOne(tenant);
        } else {
          tenantEntity = await this.tenantsService.findBySubdomain(tenant);
        }
        tenantId = tenantEntity.id;

        if (!tenantEntity.isActive) {
          throw new UnauthorizedException('Tenant is not active');
        }
      } catch (error) {
        throw new UnauthorizedException('Invalid tenant');
      }
    }

    // Find user with tenant context
    const whereClause: any = { email, isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
      include: { 
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate user's tenant is active
    if (user.tenantId && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('Tenant is not active');
    }

    // Generate tokens
    const payload = { 
      sub: user.id, 
      email: user.email, 
      roleId: user.roleId,
      tenantId: user.tenantId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    // Save refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`User logged in successfully: ${user.email} in tenant: ${user.tenant?.name || 'none'}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check refresh token in database
      if (user.refreshToken !== refreshToken ||
        !user.refreshTokenExpiresAt ||
        user.refreshTokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Generate new tokens
      const newPayload = { 
        sub: user.id, 
        email: user.email, 
        roleId: user.roleId,
        tenantId: user.tenantId,
      };
      const accessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
      });

      // Store new refresh token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      this.logger.log(`Token refreshed for user: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roleId: user.roleId,
          role: user.role,
          tenantId: user.tenantId,
        },
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error('Refresh token validation failed', error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string): Promise<{ message: string }> {
    try {
      // Clear refresh token from database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          refreshToken: null,
          refreshTokenExpiresAt: null,
        },
      });

      this.logger.log(`User logged out: ${userId}`);

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        isActive: true,
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate tenant is active if user belongs to one
    if (user.tenantId && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('Tenant is not active');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
    };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  private async generateTokens(user: any) {
    // Get user permissions
    const permissions = await this.permissionsService.getUserPermissions(user.id);
    
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      tenantId: user.tenantId,
      permissions: permissions,
    };

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    // Generate refresh token (longer-lived)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    // Calculate refresh token expiration date (1 hour from now)
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setHours(refreshTokenExpiresAt.getHours() + 1);

    // TODO: Store refresh token in database after migration
    // await this.prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     refreshToken,
    //     refreshTokenExpiresAt,
    //   },
    // });

    return {
      accessToken,
      refreshToken,
    };
  }
}
