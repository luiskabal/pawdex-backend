import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    try {
      const permission = await this.prisma.permission.create({
        data: createPermissionDto,
      });
      return permission;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Permission with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    await this.findOne(id); // Check if permission exists

    try {
      const permission = await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });
      return permission;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Permission with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if permission exists

    // Soft delete by setting isActive to false
    await this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // If user has system.admin permission, return all permissions
    const userPermissions = user.role.permissions.map(rp => rp.permission.name);
    if (userPermissions.includes('system.admin')) {
      const allPermissions = await this.prisma.permission.findMany({
        where: { isActive: true },
        select: { name: true },
      });
      return allPermissions.map(p => p.name);
    }

    return userPermissions.filter(name => {
      // Only return active permissions
      const permission = user.role.permissions.find(rp => rp.permission.name === name);
      return permission?.permission.isActive;
    });
  }

  async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    
    // Check for exact match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check for system admin permission
    if (userPermissions.includes('system.admin')) {
      return true;
    }

    // Handle :own permissions - if user has the general permission, they also have the :own version
    if (requiredPermission.endsWith(':own')) {
      const generalPermission = requiredPermission.replace(':own', '');
      return userPermissions.includes(generalPermission);
    }

    return false;
  }
}