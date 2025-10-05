import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeatureFlagEntity {
  @ApiProperty({
    description: 'Unique identifier for the feature flag',
    example: 'clh123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Unique key for the feature flag',
    example: 'advanced_reporting',
  })
  key: string;

  @ApiProperty({
    description: 'Human readable name for the feature flag',
    example: 'Advanced Reporting',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of what this feature flag controls',
    example: 'Enables advanced reporting features for veterinary clinics',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Category ID to group related features',
    example: 'clh123456789',
  })
  categoryId?: string;

  @ApiProperty({
    description: 'Whether the feature flag is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this feature is enabled globally for all users',
    example: false,
  })
  isGlobal: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Associated category information',
  })
  category?: {
    id: string;
    name: string;
    description?: string;
  };

  @ApiPropertyOptional({
    description: 'Roles that have access to this feature flag',
  })
  roleFlags?: Array<{
    id: string;
    roleId: string;
    isEnabled: boolean;
    role: {
      id: string;
      name: string;
    };
  }>;
}