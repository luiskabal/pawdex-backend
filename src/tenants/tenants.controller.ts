import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RequirePermissions('tenant:create')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 409,
    description: 'Subdomain or slug already exists',
  })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive tenants in the results',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants',
    type: [Tenant],
  })
  async findAll(@Query('includeInactive') includeInactive?: string): Promise<Tenant[]> {
    const includeInactiveBool = includeInactive === 'true';
    return this.tenantsService.findAll(includeInactiveBool);
  }

  @Get('subdomain/:subdomain')
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Get tenant by subdomain' })
  @ApiResponse({
    status: 200,
    description: 'Tenant found',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async findBySubdomain(@Param('subdomain') subdomain: string): Promise<Tenant> {
    return this.tenantsService.findBySubdomain(subdomain);
  }

  @Get('slug/:slug')
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @ApiResponse({
    status: 200,
    description: 'Tenant found',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<Tenant> {
    return this.tenantsService.findBySlug(slug);
  }

  @Get(':id')
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant found',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({
    status: 200,
    description: 'Tenant statistics',
    schema: {
      type: 'object',
      properties: {
        userCount: { type: 'number' },
        patientCount: { type: 'number' },
        appointmentCount: { type: 'number' },
        activeAppointmentCount: { type: 'number' },
      },
    },
  })
  async getTenantStats(@Param('id') id: string) {
    return this.tenantsService.getTenantStats(id);
  }

  @Patch(':id')
  @RequirePermissions('tenant:update')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Subdomain or slug already exists',
  })
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('tenant:update')
  @ApiOperation({ summary: 'Deactivate tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deactivated successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async deactivate(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.deactivate(id);
  }

  @Patch(':id/activate')
  @RequirePermissions('tenant:update')
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant activated successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async activate(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.activate(id);
  }

  @Delete(':id')
  @RequirePermissions('tenant:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({
    status: 204,
    description: 'Tenant deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete tenant with associated data',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }
}