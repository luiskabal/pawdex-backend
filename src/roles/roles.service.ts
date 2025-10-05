import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = createRoleDto;

    try {
      // Validate permission IDs if provided
      if (permissionIds && permissionIds.length > 0) {
        const existingPermissions = await this.prisma.permission.findMany({
          where: { id: { in: permissionIds }, isActive: true },
        });

        if (existingPermissions.length !== permissionIds.length) {
          throw new BadRequestException('One or more permission IDs are invalid');
        }
      }

      const role = await this.prisma.userRole.create({
        data: {
          ...roleData,
          permissions: permissionIds ? {
            create: permissionIds.map(permissionId => ({
              permissionId,
            })),
          } : undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return this.transformRole(role);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Role with this ID or name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(role => this.transformRole(role));
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.prisma.userRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.transformRole(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    await this.findOne(id); // Check if role exists

    const { permissionIds, ...roleData } = updateRoleDto;

    try {
      // Validate permission IDs if provided
      if (permissionIds && permissionIds.length > 0) {
        const existingPermissions = await this.prisma.permission.findMany({
          where: { id: { in: permissionIds }, isActive: true },
        });

        if (existingPermissions.length !== permissionIds.length) {
          throw new BadRequestException('One or more permission IDs are invalid');
        }
      }

      const role = await this.prisma.userRole.update({
        where: { id },
        data: {
          ...roleData,
          permissions: permissionIds ? {
            deleteMany: {},
            create: permissionIds.map(permissionId => ({
              permissionId,
            })),
          } : undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return this.transformRole(role);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if role exists

    // Check if role is in use
    const usersWithRole = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new ConflictException('Cannot delete role that is assigned to users');
    }

    // Soft delete by setting isActive to false
    await this.prisma.userRole.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto): Promise<Role> {
    await this.findOne(id); // Check if role exists

    const { permissionIds } = assignPermissionsDto;

    // Validate permission IDs
    const existingPermissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds }, isActive: true },
    });

    if (existingPermissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Remove existing permissions and add new ones
    const role = await this.prisma.userRole.update({
      where: { id },
      data: {
        permissions: {
          deleteMany: {},
          create: permissionIds.map(permissionId => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return this.transformRole(role);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    await this.findOne(roleId); // Check if role exists

    // Check if permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    // Remove the specific permission
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });

    return this.findOne(roleId);
  }

  private transformRole(role: any): Role {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissions?.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        isActive: rp.permission.isActive,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      })) || [],
    };
  }
}