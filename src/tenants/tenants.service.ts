import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if subdomain already exists
    const existingSubdomain = await this.prisma.tenant.findUnique({
      where: { subdomain: createTenantDto.subdomain },
    });

    if (existingSubdomain) {
      throw new ConflictException('Subdomain already exists');
    }

    // Check if slug already exists
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    // Create the tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        ...createTenantDto,
        settings: createTenantDto.settings || {},
      },
    });

    return new Tenant({
      ...tenant,
      settings: tenant.settings as Record<string, any>,
    });
  }

  async findAll(includeInactive = false): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map(tenant => new Tenant({
      ...tenant,
      settings: tenant.settings as Record<string, any>,
    }));
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return new Tenant({
      ...tenant,
      settings: tenant.settings as Record<string, any>,
    });
  }

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is inactive');
    }

    return new Tenant({
      ...tenant,
      settings: tenant.settings as Record<string, any>,
    });
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return new Tenant({
      ...tenant,
      settings: tenant.settings as Record<string, any>,
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    // Check if tenant exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check subdomain uniqueness if being updated
    if (updateTenantDto.subdomain && updateTenantDto.subdomain !== existingTenant.subdomain) {
      const existingSubdomain = await this.prisma.tenant.findUnique({
        where: { subdomain: updateTenantDto.subdomain },
      });

      if (existingSubdomain) {
        throw new ConflictException('Subdomain already exists');
      }
    }

    // Check slug uniqueness if being updated
    if (updateTenantDto.slug && updateTenantDto.slug !== existingTenant.slug) {
      const existingSlug = await this.prisma.tenant.findUnique({
        where: { slug: updateTenantDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('Slug already exists');
      }
    }

    // Update the tenant
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });

    return new Tenant({
      ...tenant,
      settings: tenant.settings as Record<string, any>,
    });
  }

  async remove(id: string): Promise<void> {
    // Check if tenant exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true } },
        patients: { select: { id: true } },
        appointments: { select: { id: true } },
      },
    });

    if (!existingTenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant has associated data
    const hasUsers = existingTenant.users.length > 0;
    const hasPatients = existingTenant.patients.length > 0;
    const hasAppointments = existingTenant.appointments.length > 0;

    if (hasUsers || hasPatients || hasAppointments) {
      throw new BadRequestException(
        'Cannot delete tenant with associated users, patients, or appointments. ' +
        'Please transfer or delete all associated data first.'
      );
    }

    // Delete the tenant
    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  async deactivate(id: string): Promise<Tenant> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<Tenant> {
    return this.update(id, { isActive: true });
  }

  async getTenantStats(id: string): Promise<{
    userCount: number;
    patientCount: number;
    appointmentCount: number;
    activeAppointmentCount: number;
  }> {
    const tenant = await this.findOne(id);

    const [userCount, patientCount, appointmentCount, activeAppointmentCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id, isActive: true } }),
      this.prisma.patient.count({ where: { tenantId: id, isActive: true } }),
      this.prisma.appointment.count({ where: { tenantId: id } }),
      this.prisma.appointment.count({
        where: {
          tenantId: id,
          date: { gte: new Date() },
        },
      }),
    ]);

    return {
      userCount,
      patientCount,
      appointmentCount,
      activeAppointmentCount,
    };
  }
}