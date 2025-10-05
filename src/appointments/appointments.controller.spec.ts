import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;
  
  const mockReq = { tenantId: 'tenant-1' };

  const mockAppointment = new Appointment({
    id: '1',
    patientId: 'patient-1',
    vetId: 'vet-1',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 30,
    reason: 'checkup',
    status: 'scheduled',
    notes: 'Regular checkup',
    estimatedCost: 150.00,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockAppointmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPatient: jest.fn(),
    findByVeterinarian: jest.fn(),
    findByDateRange: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new appointment', async () => {
      const createDto: CreateAppointmentDto = {
        patientId: 'patient-1',
        vetId: 'vet-1',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30,
        reason: 'checkup',
        notes: 'Regular checkup',
      };

      mockAppointmentsService.create.mockResolvedValue(mockAppointment);

      const mockReq = { user: { tenantId: 'tenant-1' } };
      const result = await controller.create(createDto, mockReq);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockAppointment);
    });

    it('should handle service errors', async () => {
      const createDto: CreateAppointmentDto = {
        patientId: 'patient-1',
        vetId: 'vet-1',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (invalid)
        duration: 30,
        reason: 'checkup',
      };

      mockAppointmentsService.create.mockRejectedValue(
        new BadRequestException('Scheduled date cannot be in the past')
      );

      const mockReq = { user: { tenantId: 'tenant-1' } };
      await expect(controller.create(createDto, mockReq)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated appointments', async () => {
      const mockResult = {
        data: [mockAppointment],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockAppointmentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10);

      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(mockResult);
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        data: [mockAppointment],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockAppointmentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockReq);

      expect(service.findAll).toHaveBeenCalledWith({ page: undefined, limit: undefined }, 'tenant-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return an appointment by id', async () => {
      mockAppointmentsService.findOne.mockResolvedValue(mockAppointment);

      const result = await controller.findOne('1', mockReq);

      expect(service.findOne).toHaveBeenCalledWith('1', 'tenant-1');
      expect(result).toEqual(mockAppointment);
    });

    it('should handle not found error', async () => {
      mockAppointmentsService.findOne.mockRejectedValue(
        new NotFoundException('Appointment not found')
      );

      await expect(controller.findOne('999', mockReq)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('999', 'tenant-1');
    });
  });

  describe('findByPatient', () => {
    it('should return appointments for a patient', async () => {
      const appointments = [mockAppointment];
      mockAppointmentsService.findByPatient.mockResolvedValue(appointments);

      const result = await controller.findByPatient('patient-1', mockReq);

      expect(service.findByPatient).toHaveBeenCalledWith('patient-1', 'tenant-1');
      expect(result).toEqual(appointments);
    });
  });

  describe('findByVeterinarian', () => {
    it('should return appointments for a veterinarian', async () => {
      const appointments = [mockAppointment];
      mockAppointmentsService.findByVeterinarian.mockResolvedValue(appointments);

      const result = await controller.findByVeterinarian('vet-1', mockReq);

      expect(service.findByVeterinarian).toHaveBeenCalledWith('vet-1', 'tenant-1');
      expect(result).toEqual(appointments);
    });
  });

  describe('findByDateRange', () => {
    it('should return appointments within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const appointments = [mockAppointment];

      mockAppointmentsService.findByDateRange.mockResolvedValue(appointments);

      const result = await controller.findByDateRange(startDate, endDate, mockReq);

      expect(service.findByDateRange).toHaveBeenCalledWith(startDate, endDate, 'tenant-1');
      expect(result).toEqual(appointments);
    });

    it('should handle invalid date range', async () => {
      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01'); // End before start

      mockAppointmentsService.findByDateRange.mockRejectedValue(
        new BadRequestException('Start date must be before end date')
      );

      await expect(controller.findByDateRange(startDate, endDate, mockReq)).rejects.toThrow(BadRequestException);
      expect(service.findByDateRange).toHaveBeenCalledWith(startDate, endDate, 'tenant-1');
    });
  });

  describe('update', () => {
    it('should update an appointment', async () => {
      const updateDto: UpdateAppointmentDto = {
        duration: 45,
        notes: 'Updated notes',
      };

      const updatedAppointment = { ...mockAppointment, ...updateDto };
      mockAppointmentsService.update.mockResolvedValue(updatedAppointment);

      const result = await controller.update('1', updateDto, mockReq);

      expect(service.update).toHaveBeenCalledWith('1', updateDto, 'tenant-1');
      expect(result).toEqual(updatedAppointment);
    });

    it('should handle not found error', async () => {
      const updateDto: UpdateAppointmentDto = { duration: 45 };

      mockAppointmentsService.update.mockRejectedValue(
        new NotFoundException('Appointment not found')
      );

      await expect(controller.update('999', updateDto, mockReq)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith('999', updateDto, 'tenant-1');
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const updatedAppointment = { ...mockAppointment, status: 'confirmed' };
      mockAppointmentsService.updateStatus.mockResolvedValue(updatedAppointment);

      const result = await controller.updateStatus('1', 'confirmed', mockReq);

      expect(service.updateStatus).toHaveBeenCalledWith('1', 'confirmed', 'tenant-1');
      expect(result).toEqual(updatedAppointment);
    });

    it('should handle invalid status transition', async () => {
      mockAppointmentsService.updateStatus.mockRejectedValue(
        new BadRequestException('Cannot change status from completed to scheduled')
      );

      await expect(controller.updateStatus('1', 'scheduled', mockReq)).rejects.toThrow(BadRequestException);
      expect(service.updateStatus).toHaveBeenCalledWith('1', 'scheduled', 'tenant-1');
    });
  });

  describe('cancel', () => {
    it('should cancel an appointment', async () => {
      const cancelledAppointment = { ...mockAppointment, status: 'cancelled' };
      mockAppointmentsService.cancel.mockResolvedValue(cancelledAppointment);

      const result = await controller.cancel('1', mockReq);

      expect(service.cancel).toHaveBeenCalledWith('1', 'tenant-1');
      expect(result).toEqual(cancelledAppointment);
    });

    it('should handle appointment that cannot be cancelled', async () => {
      mockAppointmentsService.cancel.mockRejectedValue(
        new BadRequestException('Appointment cannot be cancelled')
      );

      await expect(controller.cancel('1', mockReq)).rejects.toThrow(BadRequestException);
      expect(service.cancel).toHaveBeenCalledWith('1', 'tenant-1');
    });
  });

  describe('remove', () => {
    it('should soft delete an appointment', async () => {
      mockAppointmentsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', mockReq);

      expect(service.remove).toHaveBeenCalledWith('1', 'tenant-1');
    });

    it('should handle not found error', async () => {
      mockAppointmentsService.remove.mockRejectedValue(
        new NotFoundException('Appointment not found')
      );

      await expect(controller.remove('999', mockReq)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith('999', 'tenant-1');
    });
  });
});