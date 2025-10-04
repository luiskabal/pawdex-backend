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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PatientsService, CreatePatientDto, UpdatePatientDto, PaginationParams } from './patients.service';
import { Patient } from './entities/patient.entity';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body(ValidationPipe) createPatientDto: CreatePatientDto): Promise<Patient> {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients with pagination' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  async findAll(@Query() params: PaginationParams) {
    return this.patientsService.findAll(params);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get patients by owner ID' })
  @ApiParam({ name: 'ownerId', type: 'string', description: 'Owner ID' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No patients found for this owner' })
  async findByOwnerId(
    @Param('ownerId') ownerId: string,
  ) {
    return this.patientsService.findByOwnerId(ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(@Param('id') id: string): Promise<Patient> {
    return this.patientsService.findOne(id);
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
  ): Promise<Patient> {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient' })
  @ApiParam({ name: 'id', type: 'string', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully', type: Patient })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async remove(@Param('id') id: string): Promise<Patient> {
    return this.patientsService.remove(id);
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
  ): Promise<Patient> {
    return this.patientsService.addTag(id, tag);
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
  ): Promise<Patient> {
    return this.patientsService.removeTag(id, tag);
  }
}