import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({
    description: 'Unique key for the feature flag',
    example: 'advanced_reporting',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Human readable name for the feature flag',
    example: 'Advanced Reporting',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of what this feature flag controls',
    example: 'Enables advanced reporting features for veterinary clinics',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category ID to group related features',
    example: 'clh123456789',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this feature is enabled globally for all users',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}