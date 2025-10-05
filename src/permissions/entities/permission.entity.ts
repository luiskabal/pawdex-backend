import { ApiProperty } from '@nestjs/swagger';

export class Permission {
  @ApiProperty({
    description: 'Unique identifier for the permission',
    example: 'clxyz123abc456def789',
  })
  id: string;

  @ApiProperty({
    description: 'Permission name (e.g., patients.create)',
    example: 'patients.create',
  })
  name: string;

  @ApiProperty({
    description: 'Human-readable description of the permission',
    example: 'Create new patients',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Whether the permission is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'When the permission was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the permission was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}