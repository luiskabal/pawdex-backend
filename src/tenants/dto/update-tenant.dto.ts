import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}