import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, Matches, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role ID (must be lowercase, alphanumeric with hyphens)',
    example: 'custom-role',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Role ID must be lowercase alphanumeric with hyphens only',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Custom Role',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Human-readable description of the role',
    example: 'A custom role for specific users',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to this role',
    example: ['clxyz123abc456def789', 'clxyz456def789abc123'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}