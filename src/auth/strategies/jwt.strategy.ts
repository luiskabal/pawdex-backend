import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantsService } from '../../tenants/tenants.service';

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { 
        id: payload.sub,
        isActive: true,
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // If JWT contains tenant ID, validate it matches user's tenant
    if (payload.tenantId && user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Token tenant mismatch');
    }

    // Validate tenant is active if user belongs to one
    if (user.tenantId) {
      try {
        const tenant = await this.tenantsService.findOne(user.tenantId);
        if (!tenant.isActive) {
          throw new UnauthorizedException('Tenant is not active');
        }
      } catch (error) {
        throw new UnauthorizedException('Invalid tenant');
      }
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
}