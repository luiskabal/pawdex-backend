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

    const appointmentData = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        status: 'scheduled',
      },
    });

    return new Appointment(appointmentData);
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Appointment>> {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        skip,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      this.prisma.appointment.count(),
    ]);

    const appointmentEntities = appointments.map(appointment => new Appointment(appointment));

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
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return new Appointment(appointment);
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { date: 'asc' },
    });

    return appointments.map(appointment => new Appointment(appointment));
  }

  async findByVeterinarian(vetId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { vetId },
      orderBy: { date: 'asc' },
    });

    return appointments.map(appointment => new Appointment(appointment));
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
    });

    return appointments.map(appointment => new Appointment(appointment));
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Check if appointment is completed and cannot be updated
    if (existingAppointment.status === 'completed') {
      throw new BadRequestException('Cannot update completed appointment');
    }

    // Validate scheduled date if being updated
    if (updateAppointmentDto.date && updateAppointmentDto.date < new Date()) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
    });

    return new Appointment(updatedAppointment);
  }

  async updateStatus(
    id: string,
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  ): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Validate status transitions
    const appointment = new Appointment(existingAppointment);
    try {
      appointment.updateStatus(status as any);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return new Appointment(updatedAppointment);
  }

  async cancel(id: string): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Check if appointment can be cancelled
    const appointment = new Appointment(existingAppointment);
    if (!appointment.canBeCancelled()) {
      throw new BadRequestException('Appointment cannot be cancelled');
    }

    const cancelledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return new Appointment(cancelledAppointment);
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
      data: { status: 'cancelled' },
    });

    return new Appointment(deletedAppointment);
  }
}