import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Patient, Species, Gender } from './entities/patient.entity';

export interface CreatePatientDto {
  name: string;
  speciesId: string;
  breedId: string;
  gender: Gender;
  birthDate: Date;
  ownerId: string;
  tags?: string[];
}

export interface UpdatePatientDto {
  name?: string;
  speciesId?: string;
  breedId?: string;
  gender?: Gender;
  birthDate?: Date;
  tags?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  speciesId?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto, tenantId: string): Promise<Patient> {
    try {
      // Validate foreign key relationships
      const [species, breed, owner] = await Promise.all([
        this.prisma.species.findUnique({ where: { id: createPatientDto.speciesId } }),
        this.prisma.breed.findUnique({ where: { id: createPatientDto.breedId } }),
        this.prisma.user.findFirst({ 
          where: { 
            id: createPatientDto.ownerId, 
            tenantId,
            isActive: true 
          } 
        }),
      ]);

      if (!species) {
        throw new BadRequestException('Invalid species ID');
      }

      if (!breed) {
        throw new BadRequestException('Invalid breed ID');
      }

      if (!owner) {
        throw new BadRequestException('Invalid owner ID or owner not found in this tenant');
      }

      // Validate that breed belongs to the specified species
      if (breed.speciesId !== createPatientDto.speciesId) {
        throw new BadRequestException('Breed does not belong to the specified species');
      }

      // Validate basic patient data
      if (!createPatientDto.name?.trim()) {
        throw new BadRequestException('Name cannot be empty');
      }

      if (!createPatientDto.ownerId?.trim()) {
        throw new BadRequestException('Owner ID cannot be empty');
      }

      if (createPatientDto.birthDate > new Date()) {
        throw new BadRequestException('Birth date cannot be in the future');
      }

      if (!['male', 'female', 'unknown'].includes(createPatientDto.gender)) {
        throw new BadRequestException('Invalid gender');
      }

      const data = {
        name: createPatientDto.name,
        speciesId: createPatientDto.speciesId,
        breedId: createPatientDto.breedId,
        gender: createPatientDto.gender,
        birthDate: createPatientDto.birthDate,
        ownerId: createPatientDto.ownerId,
        tenantId, // TENANT ISOLATION
        tags: JSON.stringify(createPatientDto.tags || []),
      };

      const createdPatient = await this.prisma.patient.create({ 
        data,
        include: {
          species: true,
          breed: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      return this.mapToPatientEntity(createdPatient);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async findAll(params: PaginationParams, tenantId: string): Promise<PaginatedResponse<Patient>> {
    const { page = 1, limit = 10, speciesId, search } = params;
    
    // Ensure page and limit are numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    
    const skip = (pageNum - 1) * limitNum;

    const where: any = { 
      isActive: true,
      tenantId // TENANT ISOLATION
    };
    
    if (speciesId) {
      where.speciesId = speciesId;
    }
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take: limitNum,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          species: true,
          breed: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    const data = patients.map(patient => this.mapToPatientEntity(patient));
    const totalPages = Math.ceil(total / limitNum);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({
      where: { 
        id, 
        tenantId, // TENANT ISOLATION
        isActive: true 
      },
      include: {
        species: true,
        breed: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found in this tenant`);
    }

    return this.mapToPatientEntity(patient);
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, tenantId: string): Promise<Patient> {
    const existingPatient = await this.prisma.patient.findFirst({
      where: { 
        id, 
        tenantId, // TENANT ISOLATION
        isActive: true 
      },
    });

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found in this tenant`);
    }

    // Validate foreign key relationships if they're being updated
    if (updatePatientDto.speciesId || updatePatientDto.breedId) {
      const speciesId = updatePatientDto.speciesId || existingPatient.speciesId;
      const breedId = updatePatientDto.breedId || existingPatient.breedId;

      const [species, breed] = await Promise.all([
        this.prisma.species.findUnique({ where: { id: speciesId } }),
        this.prisma.breed.findUnique({ where: { id: breedId } }),
      ]);

      if (updatePatientDto.speciesId && !species) {
        throw new BadRequestException('Invalid species ID');
      }

      if (updatePatientDto.breedId && !breed) {
        throw new BadRequestException('Invalid breed ID');
      }

      // Validate that breed belongs to the specified species
      if (breed && breed.speciesId !== speciesId) {
        throw new BadRequestException('Breed does not belong to the specified species');
      }
    }

    // Validate other fields
    if (updatePatientDto.name !== undefined && !updatePatientDto.name?.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    if (updatePatientDto.birthDate && updatePatientDto.birthDate > new Date()) {
      throw new BadRequestException('Birth date cannot be in the future');
    }

    if (updatePatientDto.gender && !['male', 'female', 'unknown'].includes(updatePatientDto.gender)) {
      throw new BadRequestException('Invalid gender');
    }

    const updateData: any = { ...updatePatientDto };
    
    if (updatePatientDto.tags) {
      updateData.tags = JSON.stringify(updatePatientDto.tags);
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { 
        id,
        tenantId // TENANT ISOLATION
      },
      data: updateData,
      include: {
        species: true,
        breed: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return this.mapToPatientEntity(updatedPatient);
  }

  async remove(id: string, tenantId: string): Promise<Patient> {
    const existingPatient = await this.prisma.patient.findFirst({
      where: { 
        id, 
        tenantId, // TENANT ISOLATION
        isActive: true 
      },
    });

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found in this tenant`);
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { 
        id,
        tenantId // TENANT ISOLATION
      },
      data: { isActive: false },
      include: {
        species: true,
        breed: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return this.mapToPatientEntity(updatedPatient);
  }

  async findByOwnerId(ownerId: string, tenantId: string): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany({
      where: { 
        ownerId, 
        tenantId, // TENANT ISOLATION
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        species: true,
        breed: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return patients.map(patient => this.mapToPatientEntity(patient));
  }

  async addTag(id: string, tag: string, tenantId: string): Promise<Patient> {
    const existingPatient = await this.prisma.patient.findFirst({
      where: { 
        id, 
        tenantId, // TENANT ISOLATION
        isActive: true 
      },
    });

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found in this tenant`);
    }

    const currentTags = JSON.parse(existingPatient.tags || '[]');
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { 
        id,
        tenantId // TENANT ISOLATION
      },
      data: { tags: JSON.stringify(currentTags) },
      include: {
        species: true,
        breed: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return this.mapToPatientEntity(updatedPatient);
  }

  async removeTag(id: string, tag: string, tenantId: string): Promise<Patient> {
    const existingPatient = await this.prisma.patient.findFirst({
      where: { 
        id, 
        tenantId, // TENANT ISOLATION
        isActive: true 
      },
    });

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found in this tenant`);
    }

    const currentTags = JSON.parse(existingPatient.tags || '[]');
    const filteredTags = currentTags.filter((t: string) => t !== tag);

    const updatedPatient = await this.prisma.patient.update({
      where: { 
        id,
        tenantId // TENANT ISOLATION
      },
      data: { tags: JSON.stringify(filteredTags) },
      include: {
        species: true,
        breed: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return this.mapToPatientEntity(updatedPatient);
  }

  // Global methods (no tenant isolation needed)
  async getSpecies(): Promise<any[]> {
    return this.prisma.species.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getBreedsBySpecies(speciesId: string): Promise<any[]> {
    return this.prisma.breed.findMany({
      where: { 
        speciesId,
        isActive: true 
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAllBreeds(): Promise<any[]> {
    return this.prisma.breed.findMany({
      where: { isActive: true },
      include: { species: true },
      orderBy: [{ species: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  private mapToPatientEntity(prismaPatient: any): Patient {
    return new Patient({
      id: prismaPatient.id,
      name: prismaPatient.name,
      species: prismaPatient.species?.name as Species || prismaPatient.speciesId,
      breed: prismaPatient.breed?.name || prismaPatient.breedId,
      gender: prismaPatient.gender as Gender,
      birthDate: prismaPatient.birthDate,
      ownerId: prismaPatient.ownerId,
      tags: JSON.parse(prismaPatient.tags || '[]'),
      isActive: prismaPatient.isActive,
      createdAt: prismaPatient.createdAt,
      updatedAt: prismaPatient.updatedAt,
    });
  }
}