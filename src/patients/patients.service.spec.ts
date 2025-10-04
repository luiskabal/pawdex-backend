import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { Patient, Species, Gender } from './entities/patient.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPatientData = {
    id: 'patient-1',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    birthDate: new Date('2020-01-01'),
    ownerId: 'owner-1',
    tags: '["friendly", "vaccinated"]',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const createPatientDto = {
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
        tags: ['friendly', 'vaccinated'],
      };

      mockPrismaService.patient.create.mockResolvedValue(mockPatientData);

      const result = await service.create(createPatientDto);

      expect(mockPrismaService.patient.create).toHaveBeenCalledWith({
        data: {
          name: createPatientDto.name,
          species: createPatientDto.species,
          breed: createPatientDto.breed,
          gender: createPatientDto.gender,
          birthDate: createPatientDto.birthDate,
          ownerId: createPatientDto.ownerId,
          tags: JSON.stringify(createPatientDto.tags),
        },
      });
      expect(result).toBeInstanceOf(Patient);
      expect(result.name).toBe(createPatientDto.name);
    });

    it('should throw BadRequestException for invalid data', async () => {
      const invalidPatientDto = {
        name: '',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
      };

      await expect(service.create(invalidPatientDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of patients', async () => {
      const paginationParams = { page: 1, limit: 10 };
      const mockPatients = [mockPatientData];
      const mockCount = 1;

      mockPrismaService.patient.findMany.mockResolvedValue(mockPatients);
      mockPrismaService.patient.count.mockResolvedValue(mockCount);

      const result = await service.findAll(paginationParams);

      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.patient.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(Patient);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by species when provided', async () => {
      const paginationParams = { page: 1, limit: 10, species: 'dog' as Species };
      const mockPatients = [mockPatientData];
      const mockCount = 1;

      mockPrismaService.patient.findMany.mockResolvedValue(mockPatients);
      mockPrismaService.patient.count.mockResolvedValue(mockCount);

      await service.findAll(paginationParams);

      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isActive: true, species: 'dog' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should search by name when provided', async () => {
      const paginationParams = { page: 1, limit: 10, search: 'Buddy' };
      const mockPatients = [mockPatientData];
      const mockCount = 1;

      mockPrismaService.patient.findMany.mockResolvedValue(mockPatients);
      mockPrismaService.patient.count.mockResolvedValue(mockCount);

      await service.findAll(paginationParams);

      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { 
          isActive: true,
          name: { contains: 'Buddy', mode: 'insensitive' }
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a patient by id', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatientData);

      const result = await service.findOne('patient-1');

      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      });
      expect(result).toBeInstanceOf(Patient);
      expect(result.id).toBe('patient-1');
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a patient', async () => {
      const updatePatientDto = {
        name: 'Updated Buddy',
        breed: 'Labrador',
      };

      const updatedPatientData = {
        ...mockPatientData,
        ...updatePatientDto,
        updatedAt: new Date(),
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatientData);
      mockPrismaService.patient.update.mockResolvedValue(updatedPatientData);

      const result = await service.update('patient-1', updatePatientDto);

      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      });
      expect(mockPrismaService.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: updatePatientDto,
      });
      expect(result).toBeInstanceOf(Patient);
      expect(result.name).toBe('Updated Buddy');
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should handle tags update correctly', async () => {
      const updatePatientDto = {
        tags: ['new-tag', 'another-tag'],
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatientData);
      mockPrismaService.patient.update.mockResolvedValue({
        ...mockPatientData,
        tags: JSON.stringify(updatePatientDto.tags),
      });

      await service.update('patient-1', updatePatientDto);

      expect(mockPrismaService.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: {
          tags: JSON.stringify(updatePatientDto.tags),
        },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a patient (set isActive to false)', async () => {
      const deactivatedPatientData = {
        ...mockPatientData,
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatientData);
      mockPrismaService.patient.update.mockResolvedValue(deactivatedPatientData);

      const result = await service.remove('patient-1');

      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      });
      expect(mockPrismaService.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: { isActive: false },
      });
      expect(result).toBeInstanceOf(Patient);
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOwnerId', () => {
    it('should return patients for a specific owner', async () => {
      const mockPatients = [mockPatientData];
      mockPrismaService.patient.findMany.mockResolvedValue(mockPatients);

      const result = await service.findByOwnerId('owner-1');

      expect(mockPrismaService.patient.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'owner-1', isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Patient);
    });
  });

  describe('addTag', () => {
    it('should add a tag to a patient', async () => {
      const patientWithNewTag = {
        ...mockPatientData,
        tags: '["friendly", "vaccinated", "new-tag"]',
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatientData);
      mockPrismaService.patient.update.mockResolvedValue(patientWithNewTag);

      const result = await service.addTag('patient-1', 'new-tag');

      expect(result).toBeInstanceOf(Patient);
      expect(result.tags).toContain('new-tag');
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.addTag('non-existent', 'tag')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from a patient', async () => {
      const patientWithRemovedTag = {
        ...mockPatientData,
        tags: '["vaccinated"]',
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatientData);
      mockPrismaService.patient.update.mockResolvedValue(patientWithRemovedTag);

      const result = await service.removeTag('patient-1', 'friendly');

      expect(result).toBeInstanceOf(Patient);
      expect(result.tags).not.toContain('friendly');
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.removeTag('non-existent', 'tag')).rejects.toThrow(NotFoundException);
    });
  });
});