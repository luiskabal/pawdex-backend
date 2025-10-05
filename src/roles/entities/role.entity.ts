import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../permissions/entities/permission.entity';

export class Role {
  @ApiProperty({
    description: 'Unique identifier for the role',
    example: 'admin',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'admin',
  })
  name: string;

  @ApiProperty({
    description: 'Human-readable description of the role',
    example: 'System administrator',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Whether the role is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Permissions assigned to this role',
    type: [Permission],
    required: false,
  })
  permissions?: Permission[];
}