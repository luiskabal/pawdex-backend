import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAppointmentData = {
    id: '1',
    patientId: 'patient-1',
    vetId: 'vet-1',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 30,
    reason: 'checkup' as const,
    status: 'scheduled' as const,
    notes: 'Regular checkup',
    estimatedCost: 150.00,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const createAppointmentDto: CreateAppointmentDto = {
      patientId: 'patient-1',
      vetId: 'vet-1',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30,
      reason: 'checkup',
      notes: 'Regular checkup',
    };

  const mockUpdateAppointmentDto: UpdateAppointmentDto = {
    date: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    duration: 45,
    notes: 'Updated checkup',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new appointment', async () => {
      mockPrismaService.appointment.create.mockResolvedValue(mockAppointmentData);

      const result = await service.create(createAppointmentDto);

      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          ...createAppointmentDto,
          status: 'scheduled',
        },
      });
      expect(result).toBeInstanceOf(Appointment);
      expect(result.id).toBe(mockAppointmentData.id);
      expect(result.patientId).toBe(mockAppointmentData.patientId);
    });

    it('should throw BadRequestException for past scheduled date', async () => {
      const pastDateDto = {
        ...createAppointmentDto,
        date: new Date('2020-01-01T10:00:00Z'),
      };

      await expect(service.create(pastDateDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid duration', async () => {
      const invalidDurationDto = {
        ...createAppointmentDto,
        duration: -10,
      };

      await expect(service.create(invalidDurationDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated appointments', async () => {
      const mockAppointments = [mockAppointmentData];
      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);
      mockPrismaService.appointment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { date: 'asc' },
      });
      expect(mockPrismaService.appointment.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(Appointment);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle empty results', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply correct pagination offset', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.count.mockResolvedValue(0);

      await service.findAll({ page: 3, limit: 5 });

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        skip: 10, // (3-1) * 5
        take: 5,
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an appointment by id', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointmentData);

      const result = await service.findOne('1');

      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toBeInstanceOf(Appointment);
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: '999' },
      });
    });
  });

  describe('findByPatient', () => {
    it('should return appointments for a specific patient', async () => {
      const mockAppointments = [mockAppointmentData];
      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByPatient('patient-1');

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { patientId: 'patient-1' },
        orderBy: { date: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Appointment);
      expect(result[0].patientId).toBe('patient-1');
    });

    it('should return empty array when no appointments found for patient', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await service.findByPatient('patient-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByVeterinarian', () => {
    it('should return appointments for a specific veterinarian', async () => {
      const mockAppointments = [mockAppointmentData];
      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByVeterinarian('vet-1');

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { vetId: 'vet-1' },
        orderBy: { date: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Appointment);
      expect(result[0].vetId).toBe('vet-1');
    });

    it('should return empty array when no appointments found for veterinarian', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await service.findByVeterinarian('vet-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByDateRange', () => {
    it('should return appointments within date range', async () => {
      const startDate = new Date('2024-12-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');
      const mockAppointments = [mockAppointmentData];
      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await service.findByDateRange(startDate, endDate);

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Appointment);
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const startDate = new Date('2024-12-31T00:00:00Z');
      const endDate = new Date('2024-12-01T00:00:00Z');

      await expect(service.findByDateRange(startDate, endDate)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an appointment', async () => {
      const updatedAppointmentData = {
        ...mockAppointmentData,
        ...mockUpdateAppointmentDto,
        updatedAt: new Date(),
      };
      
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointmentData);
      mockPrismaService.appointment.update.mockResolvedValue(updatedAppointmentData);

      const result = await service.update('1', mockUpdateAppointmentDto);

      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: mockUpdateAppointmentDto,
      });
      expect(result).toBeInstanceOf(Appointment);
      expect(result.duration).toBe(45);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.update('999', mockUpdateAppointmentDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating to past date', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointmentData);
      
      const pastDateUpdate = {
        date: new Date('2020-01-01T10:00:00Z'),
      };

      await expect(service.update('1', pastDateUpdate)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating completed appointment', async () => {
      const completedAppointment = {
        ...mockAppointmentData,
        status: 'completed' as const,
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(completedAppointment);

      await expect(service.update('1', mockUpdateAppointmentDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const updatedAppointmentData = {
        ...mockAppointmentData,
        status: 'completed' as const,
        updatedAt: new Date(),
      };
      
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointmentData);
      mockPrismaService.appointment.update.mockResolvedValue(updatedAppointmentData);

      const result = await service.updateStatus('1', 'completed');

      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'completed' },
      });
      expect(result).toBeInstanceOf(Appointment);
      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('999', 'completed')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const completedAppointment = {
        ...mockAppointmentData,
        status: 'completed' as const,
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(completedAppointment);

      await expect(service.updateStatus('1', 'scheduled')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel an appointment', async () => {
      const cancelledAppointmentData = {
        ...mockAppointmentData,
        status: 'cancelled' as const,
        updatedAt: new Date(),
      };
      
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointmentData);
      mockPrismaService.appointment.update.mockResolvedValue(cancelledAppointmentData);

      const result = await service.cancel('1');

      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'cancelled' },
      });
      expect(result).toBeInstanceOf(Appointment);
      expect(result.status).toBe('cancelled');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.cancel('999')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when appointment cannot be cancelled', async () => {
      const completedAppointment = {
        ...mockAppointmentData,
        status: 'completed' as const,
      };
      mockPrismaService.appointment.findUnique.mockResolvedValue(completedAppointment);

      await expect(service.cancel('1')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete an appointment', async () => {
      const deletedAppointmentData = {
        ...mockAppointmentData,
        status: 'cancelled' as const,
        updatedAt: new Date(),
      };
      
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointmentData);
      mockPrismaService.appointment.update.mockResolvedValue(deletedAppointmentData);

      const result = await service.remove('1');

      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'cancelled' },
      });
      expect(result).toBeInstanceOf(Appointment);
      expect(result.status).toBe('cancelled');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.appointment.update).not.toHaveBeenCalled();
    });
  });
});