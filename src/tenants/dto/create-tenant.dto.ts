import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsObject, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Display name of the tenant/clinic',
    example: 'Happy Paws Veterinary Clinic',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Subdomain for tenant access (alphanumeric and hyphens only)',
    example: 'happypaws',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
  })
  subdomain: string;

  @ApiProperty({
    description: 'URL-friendly slug for the tenant',
    example: 'happy-paws-clinic',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    description: 'Contact email for the tenant',
    example: 'contact@happypaws.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Contact phone number for the tenant',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Physical address of the clinic',
    example: '123 Main St, Anytown, ST 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    description: 'Tenant-specific configuration settings',
    example: { theme: 'blue', timezone: 'America/New_York' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}