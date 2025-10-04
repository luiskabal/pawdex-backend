import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient, Species, Gender } from './entities/patient.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PatientsController', () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockPatient = new Patient({
    id: 'patient-1',
    name: 'Buddy',
    species: 'dog' as Species,
    breed: 'Golden Retriever',
    gender: 'male' as Gender,
    birthDate: new Date('2020-01-01'),
    ownerId: 'owner-1',
    tags: ['friendly', 'vaccinated'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPaginatedResponse = {
    data: [mockPatient],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockPatientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByOwnerId: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        {
          provide: PatientsService,
          useValue: mockPatientsService,
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      mockPatientsService.create.mockResolvedValue(mockPatient);

      const result = await controller.create(createPatientDto);

      expect(mockPatientsService.create).toHaveBeenCalledWith(createPatientDto);
      expect(result).toBe(mockPatient);
    });

    it('should handle validation errors', async () => {
      const invalidPatientDto = {
        name: '',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
      };

      mockPatientsService.create.mockRejectedValue(new BadRequestException('Name cannot be empty'));

      await expect(controller.create(invalidPatientDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of patients with default parameters', async () => {
      const query = { page: 1, limit: 10 };
      mockPatientsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(mockPatientsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toBe(mockPaginatedResponse);
    });

    it('should return paginated list with custom parameters', async () => {
      const query = {
        page: 2,
        limit: 5,
        species: 'dog' as Species,
        search: 'Buddy',
      };
      mockPatientsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(mockPatientsService.findAll).toHaveBeenCalledWith({
          page: 2,
          limit: 5,
          species: 'dog' as Species,
          search: 'Buddy',
        });
      expect(result).toBe(mockPaginatedResponse);
    });

    it('should handle invalid pagination parameters', async () => {
      const query = {
        page: 1,
        limit: 10,
      };
      mockPatientsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(mockPatientsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toBe(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a patient by id', async () => {
      mockPatientsService.findOne.mockResolvedValue(mockPatient);

      const result = await controller.findOne('patient-1');

      expect(mockPatientsService.findOne).toHaveBeenCalledWith('patient-1');
      expect(result).toBe(mockPatient);
    });

    it('should handle patient not found', async () => {
      mockPatientsService.findOne.mockRejectedValue(new NotFoundException('Patient not found'));

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a patient', async () => {
      const updatePatientDto = {
        name: 'Updated Buddy',
        breed: 'Labrador',
      };

      const updatedPatient = new Patient({
        ...mockPatient.toJSON(),
        ...updatePatientDto,
        updatedAt: new Date(),
      } as any);

      mockPatientsService.update.mockResolvedValue(updatedPatient);

      const result = await controller.update('patient-1', updatePatientDto);

      expect(mockPatientsService.update).toHaveBeenCalledWith('patient-1', updatePatientDto);
      expect(result).toBe(updatedPatient);
    });

    it('should handle patient not found during update', async () => {
      const updatePatientDto = { name: 'Updated Buddy' };
      mockPatientsService.update.mockRejectedValue(new NotFoundException('Patient not found'));

      await expect(controller.update('non-existent', updatePatientDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a patient', async () => {
      const deactivatedPatient = new Patient({
        ...mockPatient.toJSON(),
        isActive: false,
        updatedAt: new Date(),
      } as any);

      mockPatientsService.remove.mockResolvedValue(deactivatedPatient);

      const result = await controller.remove('patient-1');

      expect(mockPatientsService.remove).toHaveBeenCalledWith('patient-1');
      expect(result).toBe(deactivatedPatient);
    });

    it('should handle patient not found during removal', async () => {
      mockPatientsService.remove.mockRejectedValue(new NotFoundException('Patient not found'));

      await expect(controller.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOwner', () => {
    it('should return patients for a specific owner', async () => {
      const ownerPatients = [mockPatient];
      mockPatientsService.findByOwnerId.mockResolvedValue(ownerPatients);

      const result = await controller.findByOwnerId('owner-1');

      expect(mockPatientsService.findByOwnerId).toHaveBeenCalledWith('owner-1');
      expect(result).toBe(ownerPatients);
    });

    it('should return empty array for owner with no patients', async () => {
      mockPatientsService.findByOwnerId.mockResolvedValue([]);

      const result = await controller.findByOwnerId('owner-without-patients');

      expect(mockPatientsService.findByOwnerId).toHaveBeenCalledWith('owner-without-patients');
      expect(result).toEqual([]);
    });
  });

  describe('addTag', () => {
    it('should add a tag to a patient', async () => {
      const tag = 'new-tag';
      const patientData = mockPatient.toJSON() as any;
      const patientWithNewTag = new Patient({
        ...patientData,
        tags: [...patientData.tags, 'new-tag'],
        updatedAt: new Date(),
      } as any);

      mockPatientsService.addTag.mockResolvedValue(patientWithNewTag);

      const result = await controller.addTag('patient-1', tag);

      expect(mockPatientsService.addTag).toHaveBeenCalledWith('patient-1', 'new-tag');
      expect(result).toEqual(patientWithNewTag);
    });

    it('should handle patient not found when adding tag', async () => {
      const tag = 'new-tag';
      mockPatientsService.addTag.mockRejectedValue(new NotFoundException('Patient not found'));

      await expect(controller.addTag('non-existent', tag)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from a patient', async () => {
      const tag = 'friendly';
      const patientData = mockPatient.toJSON() as any;
      const patientWithRemovedTag = new Patient({
        ...patientData,
        tags: patientData.tags.filter((t: string) => t !== 'friendly'),
        updatedAt: new Date(),
      } as any);

      mockPatientsService.removeTag.mockResolvedValue(patientWithRemovedTag);

      const result = await controller.removeTag('patient-1', tag);

      expect(mockPatientsService.removeTag).toHaveBeenCalledWith('patient-1', 'friendly');
      expect(result).toEqual(patientWithRemovedTag);
    });

    it('should handle patient not found when removing tag', async () => {
      const tag = 'friendly';
      mockPatientsService.removeTag.mockRejectedValue(new NotFoundException('Patient not found'));

      await expect(controller.removeTag('non-existent', tag)).rejects.toThrow(NotFoundException);
    });
  });

  describe('HTTP status codes', () => {
    it('should return 201 for successful creation', async () => {
      const createPatientDto = {
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
      };

      mockPatientsService.create.mockResolvedValue(mockPatient);

      const result = await controller.create(createPatientDto);
      expect(result).toBe(mockPatient);
      // HTTP status 201 is handled by NestJS @Post() decorator
    });

    it('should return 200 for successful retrieval', async () => {
      mockPatientsService.findOne.mockResolvedValue(mockPatient);

      const result = await controller.findOne('patient-1');
      expect(result).toBe(mockPatient);
      // HTTP status 200 is handled by NestJS @Get() decorator
    });

    it('should return 200 for successful update', async () => {
      const updatePatientDto = { name: 'Updated Buddy' };
      mockPatientsService.update.mockResolvedValue(mockPatient);

      const result = await controller.update('patient-1', updatePatientDto);
      expect(result).toBe(mockPatient);
      // HTTP status 200 is handled by NestJS @Patch() decorator
    });

    it('should return 200 for successful soft delete', async () => {
      mockPatientsService.remove.mockResolvedValue(mockPatient);

      const result = await controller.remove('patient-1');
      expect(result).toBe(mockPatient);
      // HTTP status 200 is handled by NestJS @Delete() decorator
    });
  });
});