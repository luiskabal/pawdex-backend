import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name (e.g., patients.create)',
    example: 'patients.create',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]+(\.[a-z]+)*(:own)?$/, {
    message: 'Permission name must follow the pattern: resource.action or resource.action:own',
  })
  name: string;

  @ApiProperty({
    description: 'Human-readable description of the permission',
    example: 'Create new patients',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}