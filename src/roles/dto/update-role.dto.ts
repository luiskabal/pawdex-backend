import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRoleDto extends PartialType(OmitType(CreateRoleDto, ['id'] as const)) {
  @ApiProperty({
    description: 'Whether the role is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}