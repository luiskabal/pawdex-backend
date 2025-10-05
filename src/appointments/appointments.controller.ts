import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { RequireTenant } from '../common/decorators/require-tenant.decorator';

@ApiTags('appointments')
@Controller('appointments')
@RequireTenant()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'The appointment has been successfully created.',
    type: Appointment,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @Req() req: any): Promise<Appointment> {
    return this.appointmentsService.create(createAppointmentDto, req.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated appointments.',
  })
  async findAll(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.appointmentsService.findAll({ page, limit }, req.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by id' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the appointment.',
    type: Appointment,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<Appointment> {
    return this.appointmentsService.findOne(id, req.tenantId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get appointments by patient ID' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiResponse({
    status: 200,
    description: 'Return appointments for the patient.',
    type: [Appointment],
  })
  async findByPatient(@Param('patientId') patientId: string, @Req() req: any): Promise<Appointment[]> {
    return this.appointmentsService.findByPatient(patientId, req.tenantId);
  }

  @Get('veterinarian/:vetId')
  @ApiOperation({ summary: 'Get appointments by veterinarian ID' })
  @ApiParam({ name: 'vetId', description: 'Veterinarian ID' })
  @ApiResponse({
    status: 200,
    description: 'Return appointments for the veterinarian.',
    type: [Appointment],
  })
  async findByVeterinarian(@Param('vetId') vetId: string, @Req() req: any): Promise<Appointment[]> {
    return this.appointmentsService.findByVeterinarian(vetId, req.tenantId);
  }

  @Get('date-range/:startDate/:endDate')
  @ApiOperation({ summary: 'Get appointments within a date range' })
  @ApiParam({ name: 'startDate', description: 'Start date (ISO string)' })
  @ApiParam({ name: 'endDate', description: 'End date (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Return appointments within the date range.',
    type: [Appointment],
  })
  @ApiResponse({ status: 400, description: 'Invalid date range.' })
  async findByDateRange(
    @Param('startDate') startDate: Date,
    @Param('endDate') endDate: Date,
    @Req() req: any,
  ): Promise<Appointment[]> {
    return this.appointmentsService.findByDateRange(startDate, endDate, req.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'The appointment has been successfully updated.',
    type: Appointment,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Req() req: any,
  ): Promise<Appointment> {
    return this.appointmentsService.update(id, updateAppointmentDto, req.tenantId);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiParam({ name: 'status', description: 'New status' })
  @ApiResponse({
    status: 200,
    description: 'The appointment status has been successfully updated.',
    type: Appointment,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show',
    @Req() req: any,
  ): Promise<Appointment> {
    return this.appointmentsService.updateStatus(id, status, req.tenantId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'The appointment has been successfully cancelled.',
    type: Appointment,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  @ApiResponse({ status: 400, description: 'Appointment cannot be cancelled.' })
  async cancel(@Param('id') id: string, @Req() req: any): Promise<Appointment> {
    return this.appointmentsService.cancel(id, req.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'The appointment has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<Appointment> {
    return this.appointmentsService.remove(id, req.tenantId);
  }
}