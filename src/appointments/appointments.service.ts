import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // Validate scheduled date is not in the past
    if (createAppointmentDto.date < new Date()) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    // Validate duration is positive
    if (createAppointmentDto.duration <= 0) {
      throw new BadRequestException('Duration must be positive');
    }

    // Use the human-readable 'scheduled' status ID directly

    const appointmentData = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        statusId: 'scheduled',
      },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return new Appointment(this.mapToAppointmentData(appointmentData));
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Appointment>> {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          status: true,
          patient: {
            include: {
              species: true,
              breed: true,
            },
          },
          vet: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.appointment.count(),
    ]);

    const appointmentEntities = appointments.map(appointment => new Appointment(this.mapToAppointmentData(appointment)));

    return {
      data: appointmentEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return new Appointment(this.mapToAppointmentData(appointment));
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { date: 'asc' },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return appointments.map(appointment => new Appointment(this.mapToAppointmentData(appointment)));
  }

  async findByVeterinarian(vetId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { vetId },
      orderBy: { date: 'asc' },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return appointments.map(appointment => new Appointment(this.mapToAppointmentData(appointment)));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return appointments.map(appointment => new Appointment(this.mapToAppointmentData(appointment)));
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Check if appointment is completed and cannot be updated
    if (existingAppointment.status?.name === 'completed') {
      throw new BadRequestException('Cannot update completed appointment');
    }

    // Validate scheduled date if being updated
    if (updateAppointmentDto.date && updateAppointmentDto.date < new Date()) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    // Exclude patientId, vetId, and status from updates as they need special handling
    const { patientId, vetId, status, ...updateData } = updateAppointmentDto;
    
    // If status is provided, convert it to statusId
    const finalUpdateData: any = { ...updateData };
    if (status) {
      finalUpdateData.statusId = status;
    }
    
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: finalUpdateData,
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return new Appointment(this.mapToAppointmentData(updatedAppointment));
  }

  async updateStatus(
    id: string,
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  ): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Convert status name to human-readable ID format
    const statusId = status.replace('-', '_');

    // Validate status transitions
    const appointment = new Appointment(this.mapToAppointmentData(existingAppointment));
    try {
      appointment.updateStatus(status as any);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { statusId },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return new Appointment(this.mapToAppointmentData(updatedAppointment));
  }

  async cancel(id: string): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Check if appointment can be cancelled - use statusId directly
    console.log('Appointment statusId:', existingAppointment.statusId);
    console.log('Can cancel scheduled?', existingAppointment.statusId === 'scheduled');
    console.log('Can cancel confirmed?', existingAppointment.statusId === 'confirmed');
    
    if (existingAppointment.statusId !== 'scheduled' && existingAppointment.statusId !== 'confirmed') {
      throw new BadRequestException(`Appointment cannot be cancelled. Current status: ${existingAppointment.statusId}`);
    }

    const cancelledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { statusId: 'cancelled' },
      include: {
        status: true,
        patient: {
          include: {
            species: true,
            breed: true,
          },
        },
        vet: {
          include: {
            role: true,
          },
        },
      },
    });

    return new Appointment(this.mapToAppointmentData(cancelledAppointment));
  }

  async remove(id: string): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Soft delete by setting status to cancelled
    const deletedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { statusId: 'cancelled' },
      include: {
        status: true,
      },
    });

    return new Appointment(this.mapToAppointmentData(deletedAppointment));
  }

  private mapToAppointmentData(prismaAppointment: any): any {
    return {
      id: prismaAppointment.id,
      patientId: prismaAppointment.patientId,
      vetId: prismaAppointment.vetId,
      date: prismaAppointment.date,
      duration: prismaAppointment.duration,
      reason: prismaAppointment.reason,
      status: prismaAppointment.status?.name || prismaAppointment.statusId,
      notes: prismaAppointment.notes,
      estimatedCost: prismaAppointment.estimatedCost,
      createdAt: prismaAppointment.createdAt,
      updatedAt: prismaAppointment.updatedAt,
    };
  }
}