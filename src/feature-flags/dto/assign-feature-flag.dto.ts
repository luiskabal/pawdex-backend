import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignFeatureFlagDto {
  @ApiProperty({
    description: 'Role ID to assign the feature flag to',
    example: 'role_admin',
  })
  @IsString()
  roleId: string;

  @ApiProperty({
    description: 'Feature flag ID to assign',
    example: 'clh123456789',
  })
  @IsString()
  featureFlagId: string;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is enabled for this role',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class BulkAssignFeatureFlagDto {
  @ApiProperty({
    description: 'Role ID to assign feature flags to',
    example: 'role_admin',
  })
  @IsString()
  roleId: string;

  @ApiProperty({
    description: 'Array of feature flag IDs to assign',
    example: ['clh123456789', 'clh987654321'],
  })
  @IsArray()
  @IsString({ each: true })
  featureFlagIds: string[];

  @ApiPropertyOptional({
    description: 'Whether the feature flags are enabled for this role',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}