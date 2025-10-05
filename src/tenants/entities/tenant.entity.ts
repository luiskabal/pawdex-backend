import { ApiProperty } from '@nestjs/swagger';

export class Tenant {
  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: 'cuid123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the tenant/clinic',
    example: 'Happy Paws Veterinary Clinic',
  })
  name: string;

  @ApiProperty({
    description: 'Subdomain for tenant access',
    example: 'happypaws',
  })
  subdomain: string;

  @ApiProperty({
    description: 'URL-friendly slug for the tenant',
    example: 'happy-paws-clinic',
  })
  slug: string;

  @ApiProperty({
    description: 'Contact email for the tenant',
    example: 'contact@happypaws.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Contact phone number for the tenant',
    example: '+1-555-123-4567',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Physical address of the clinic',
    example: '123 Main St, Anytown, ST 12345',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Tenant-specific configuration settings',
    example: { theme: 'blue', timezone: 'America/New_York' },
  })
  settings: Record<string, any>;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'When the tenant was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the tenant was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<Tenant>) {
    Object.assign(this, partial);
  }
}