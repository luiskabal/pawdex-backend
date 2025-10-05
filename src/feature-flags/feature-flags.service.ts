import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { AssignFeatureFlagDto, BulkAssignFeatureFlagDto } from './dto/assign-feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  async create(createFeatureFlagDto: CreateFeatureFlagDto) {
    // Check if feature flag key already exists
    const existingFlag = await this.prisma.featureFlag.findUnique({
      where: { key: createFeatureFlagDto.key },
    });

    if (existingFlag) {
      throw new ConflictException(`Feature flag with key '${createFeatureFlagDto.key}' already exists`);
    }

    return this.prisma.featureFlag.create({
      data: createFeatureFlagDto,
      include: {
        category: true,
        roleFlags: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.featureFlag.findMany({
      include: {
        category: true,
        roleFlags: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { id },
      include: {
        category: true,
        roleFlags: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }

    return featureFlag;
  }

  async findByKey(key: string) {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { key },
      include: {
        category: true,
        roleFlags: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with key '${key}' not found`);
    }

    return featureFlag;
  }

  async update(id: string, updateFeatureFlagDto: UpdateFeatureFlagDto) {
    // Check if feature flag exists
    await this.findOne(id);

    // If updating key, check for conflicts
    if (updateFeatureFlagDto.key) {
      const existingFlag = await this.prisma.featureFlag.findUnique({
        where: { key: updateFeatureFlagDto.key },
      });

      if (existingFlag && existingFlag.id !== id) {
        throw new ConflictException(`Feature flag with key '${updateFeatureFlagDto.key}' already exists`);
      }
    }

    return this.prisma.featureFlag.update({
      where: { id },
      data: updateFeatureFlagDto,
      include: {
        category: true,
        roleFlags: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if feature flag exists
    await this.findOne(id);

    return this.prisma.featureFlag.delete({
      where: { id },
    });
  }

  // Role-based feature flag methods
  async assignToRole(assignFeatureFlagDto: AssignFeatureFlagDto) {
    const { roleId, featureFlagId, isEnabled = true } = assignFeatureFlagDto;

    // Verify role and feature flag exist
    const role = await this.prisma.userRole.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    const featureFlag = await this.prisma.featureFlag.findUnique({ where: { id: featureFlagId } });
    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID '${featureFlagId}' not found`);
    }

    // Create or update the assignment
    return this.prisma.roleFeatureFlag.upsert({
      where: {
        roleId_featureFlagId: {
          roleId,
          featureFlagId,
        },
      },
      update: {
        isEnabled,
      },
      create: {
        roleId,
        featureFlagId,
        isEnabled,
      },
      include: {
        role: true,
        featureFlag: true,
      },
    });
  }

  async bulkAssignToRole(bulkAssignDto: BulkAssignFeatureFlagDto) {
    const { roleId, featureFlagIds, isEnabled = true } = bulkAssignDto;

    // Verify role exists
    const role = await this.prisma.userRole.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Verify all feature flags exist
    const featureFlags = await this.prisma.featureFlag.findMany({
      where: { id: { in: featureFlagIds } },
    });

    if (featureFlags.length !== featureFlagIds.length) {
      const foundIds = featureFlags.map(ff => ff.id);
      const missingIds = featureFlagIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Feature flags not found: ${missingIds.join(', ')}`);
    }

    // Create assignments
    const assignments = featureFlagIds.map(featureFlagId => ({
      roleId,
      featureFlagId,
      isEnabled,
    }));

    // Use transaction to ensure all assignments succeed or fail together
    return this.prisma.$transaction(
      assignments.map(assignment =>
        this.prisma.roleFeatureFlag.upsert({
          where: {
            roleId_featureFlagId: {
              roleId: assignment.roleId,
              featureFlagId: assignment.featureFlagId,
            },
          },
          update: {
            isEnabled: assignment.isEnabled,
          },
          create: assignment,
          include: {
            role: true,
            featureFlag: true,
          },
        })
      )
    );
  }

  async removeFromRole(roleId: string, featureFlagId: string) {
    const assignment = await this.prisma.roleFeatureFlag.findUnique({
      where: {
        roleId_featureFlagId: {
          roleId,
          featureFlagId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Feature flag assignment not found`);
    }

    return this.prisma.roleFeatureFlag.delete({
      where: {
        roleId_featureFlagId: {
          roleId,
          featureFlagId,
        },
      },
    });
  }

  async getRoleFeatureFlags(roleId: string) {
    const role = await this.prisma.userRole.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    return this.prisma.roleFeatureFlag.findMany({
      where: { roleId },
      include: {
        featureFlag: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        featureFlag: {
          name: 'asc',
        },
      },
    });
  }

  // User-specific feature flag evaluation
  async getUserFeatureFlags(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Get global feature flags (enabled for all users)
    const globalFlags = await this.prisma.featureFlag.findMany({
      where: {
        isActive: true,
        isGlobal: true,
      },
      select: { key: true },
    });

    // Get role-specific feature flags
    const roleFlags = await this.prisma.roleFeatureFlag.findMany({
      where: {
        roleId: user.roleId,
        isEnabled: true,
        featureFlag: {
          isActive: true,
        },
      },
      include: {
        featureFlag: {
          select: { key: true },
        },
      },
    });

    // Combine and deduplicate
    const allFlags = [
      ...globalFlags.map(flag => flag.key),
      ...roleFlags.map(rf => rf.featureFlag.key),
    ];

    return [...new Set(allFlags)];
  }

  async hasFeatureFlag(userId: string, featureFlagKey: string): Promise<boolean> {
    const userFlags = await this.getUserFeatureFlags(userId);
    return userFlags.includes(featureFlagKey);
  }

  async isFeatureFlagEnabled(featureFlagKey: string, roleId?: string): Promise<boolean> {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { key: featureFlagKey },
      include: {
        roleFlags: roleId ? {
          where: { roleId },
        } : undefined,
      },
    });

    if (!featureFlag || !featureFlag.isActive) {
      return false;
    }

    // If it's a global flag, it's enabled
    if (featureFlag.isGlobal) {
      return true;
    }

    // If no role specified, return false for non-global flags
    if (!roleId) {
      return false;
    }

    // Check if the role has this feature flag enabled
    const roleAssignment = featureFlag.roleFlags.find(rf => rf.roleId === roleId);
    return roleAssignment?.isEnabled ?? false;
  }
}