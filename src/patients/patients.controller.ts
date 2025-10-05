import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PatientsService, CreatePatientDto, UpdatePatientDto, PaginationParams } from './patients.service';
import { Patient } from './entities/patient.entity';
import { RequireTenant } from '../common/decorators/require-tenant.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('patients')
@Controller('patients')
@RequireTenant()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body(ValidationPipe) createPatientDto: CreatePatientDto,
    @Req() req: any
  ): Promise<Patient> {
    return this.patientsService.create(createPatientDto, req.tenantId);
  }

  @Get('species')
  @ApiOperation({ summary: 'Get all available species' })
  @ApiResponse({ status: 200, description: 'Species retrieved successfully' })
  async getSpecies() {
    return this.patientsService.getSpecies();
  }

  @Get('breeds')
  @ApiOperation({ summary: 'Get all breeds' })
  @ApiResponse({ status: 200, description: 'Breeds retrieved successfully' })
  async getAllBreeds() {
    return this.patientsService.getAllBreeds();
  }

  @Get('species/:speciesId/breeds')
  @ApiOperation({ summary: 'Get breeds by species' })
  @ApiParam({ name: 'speciesId', type: 'string', description: 'Species ID' })
  @ApiResponse({ status: 200, description: 'Breeds retrieved successfully' })
  async getBreedsBySpecies(@Param('speciesId') speciesId: string) {
    return this.patientsService.getBreedsBySpecies(speciesId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients with pagination' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'speciesId', required: false, type: String, description: 'Filter by species ID' })
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('speciesId') speciesId?: string,
    @Query('search') search?: string
  ) {
    const params: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      speciesId,
      search,
    };
    return this.patientsService.findAll(params, req.tenantId);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get patients by owner ID' })
  @ApiParam({ name: 'ownerId', type: 'string', description: 'Owner ID' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No patients found for this owner' })
  async findByOwnerId(
    @Param('ownerId') ownerId: string,
    @Req() req: any
  ) {
    return this.patientsService.findByOwnerId(ownerId, req.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any
  ): Promise<Patient> {
    return this.patientsService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePatientDto: UpdatePatientDto,
    @Req() req: any
  ): Promise<Patient> {
    return this.patientsService.update(id, updatePatientDto, req.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully', type: Patient })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: any
  ): Promise<Patient> {
    return this.patientsService.remove(id, req.tenantId);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add a tag to a patient' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Tag added successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 400, description: 'Invalid tag data' })
  async addTag(
    @Param('id') id: string,
    @Body('tag') tag: string,
    @Req() req: any
  ): Promise<Patient> {
    return this.patientsService.addTag(id, tag, req.tenantId);
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove a tag from a patient' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiParam({ name: 'tag', type: 'string', description: 'Tag to remove' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
    @Req() req: any
  ): Promise<Patient> {
    return this.patientsService.removeTag(id, tag, req.tenantId);
  }
}