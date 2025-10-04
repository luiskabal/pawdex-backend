import { IsString, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID of the patient for this appointment',
    example: 'patient-123',
  })
  @IsString()
  patientId: string;

  @ApiProperty({
    description: 'ID of the veterinarian for this appointment',
    example: 'vet-456',
  })
  @IsString()
  vetId: string;

  @ApiProperty({
    description: 'Scheduled date and time for the appointment',
    example: '2024-12-01T10:00:00Z',
  })
  @IsDateString()
  date: Date;

  @ApiProperty({
    description: 'Duration of the appointment in minutes',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Reason for the appointment',
    example: 'Regular checkup',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the appointment',
    example: 'Regular annual checkup',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost for the appointment',
    example: 150.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;
}