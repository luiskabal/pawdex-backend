import { ApiProperty } from '@nestjs/swagger';

export type AppointmentType = 'checkup' | 'vaccination' | 'surgery' | 'emergency' | 'consultation';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentData {
  id: string;
  patientId: string;
  vetId: string;
  date: Date;
  duration: number;
  reason: string;
  status: string;
  notes?: string;
  estimatedCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Appointment {
  @ApiProperty({ description: 'Unique identifier for the appointment' })
  public readonly id: string;

  @ApiProperty({ description: 'ID of the patient for this appointment' })
  public readonly patientId: string;

  @ApiProperty({ description: 'ID of the veterinarian for this appointment' })
  public readonly vetId: string;

  @ApiProperty({ description: 'Scheduled date and time for the appointment' })
  public readonly date: Date;

  @ApiProperty({ description: 'Duration of the appointment in minutes' })
  public readonly duration: number;

  @ApiProperty({ description: 'Reason for the appointment' })
  public readonly reason: string;

  @ApiProperty({ description: 'Current status of the appointment' })
  public status: string;

  @ApiProperty({ description: 'Additional notes for the appointment', required: false })
  public readonly notes?: string;

  @ApiProperty({ description: 'Estimated cost for the appointment', required: false })
  public readonly estimatedCost?: number;

  @ApiProperty({ description: 'Date when the appointment was created' })
  public readonly createdAt: Date;

  @ApiProperty({ description: 'Date when the appointment was last updated' })
  public readonly updatedAt: Date;

  constructor(data: AppointmentData) {
    this.validateData(data);
    
    this.id = data.id;
    this.patientId = data.patientId;
    this.vetId = data.vetId;
    this.date = data.date;
    this.duration = data.duration;
    this.reason = data.reason;
    this.status = data.status;
    this.notes = data.notes;
    this.estimatedCost = data.estimatedCost;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  private validateData(data: AppointmentData): void {
    if (data.duration <= 0) {
      throw new Error('Duration must be a positive number');
    }
  }

  validateScheduledDate(): void {
    const now = new Date();
    if (this.date < now && this.status === 'scheduled') {
      throw new Error('Scheduled date cannot be in the past');
    }
  }

  getEndTime(): Date {
    return new Date(this.date.getTime() + (this.duration * 60 * 1000));
  }

  isUpcoming(): boolean {
    return this.date > new Date() && this.status !== 'cancelled' && this.status !== 'completed';
  }

  canBeCancelled(): boolean {
    return this.status === 'scheduled' || this.status === 'confirmed';
  }

  updateStatus(newStatus: AppointmentStatus): void {
    this.validateStatusTransition(newStatus);
    this.status = newStatus;
  }

  private validateStatusTransition(newStatus: AppointmentStatus): void {
    const invalidTransitions = [
      { from: 'completed', to: 'scheduled' },
      { from: 'completed', to: 'confirmed' },
      { from: 'completed', to: 'in_progress' },
      { from: 'cancelled', to: 'scheduled' },
      { from: 'cancelled', to: 'confirmed' },
      { from: 'cancelled', to: 'in_progress' },
      { from: 'no_show', to: 'scheduled' },
      { from: 'no_show', to: 'confirmed' },
      { from: 'no_show', to: 'in_progress' },
    ];

    const isInvalidTransition = invalidTransitions.some(
      transition => transition.from === this.status && transition.to === newStatus
    );

    if (isInvalidTransition) {
      throw new Error(`Cannot change status from ${this.status} to ${newStatus}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      patientId: this.patientId,
      vetId: this.vetId,
      date: this.date.toISOString(),
      duration: this.duration,
      reason: this.reason,
      status: this.status,
      notes: this.notes,
      estimatedCost: this.estimatedCost,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  equals(other: Appointment): boolean {
    return (
      this.id === other.id &&
      this.patientId === other.patientId &&
      this.vetId === other.vetId &&
      this.date.getTime() === other.date.getTime() &&
      this.duration === other.duration &&
      this.reason === other.reason &&
      this.status === other.status
    );
  }
}