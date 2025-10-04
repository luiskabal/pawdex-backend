import { Appointment, AppointmentData } from './appointment.entity';

describe('Appointment Entity', () => {
  const mockAppointmentData: AppointmentData = {
    id: 'appointment-1',
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

  describe('constructor', () => {
    it('should create an appointment with all required fields', () => {
      const appointment = new Appointment(mockAppointmentData);

      expect(appointment.id).toBe(mockAppointmentData.id);
    expect(appointment.patientId).toBe(mockAppointmentData.patientId);
    expect(appointment.vetId).toBe(mockAppointmentData.vetId);
    expect(appointment.date).toBe(mockAppointmentData.date);
    expect(appointment.duration).toBe(mockAppointmentData.duration);
    expect(appointment.reason).toBe(mockAppointmentData.reason);
    expect(appointment.status).toBe(mockAppointmentData.status);
    expect(appointment.notes).toBe(mockAppointmentData.notes);
    expect(appointment.estimatedCost).toBe(mockAppointmentData.estimatedCost);
    expect(appointment.createdAt).toBe(mockAppointmentData.createdAt);
    expect(appointment.updatedAt).toBe(mockAppointmentData.updatedAt);
    });

    it('should create an appointment with minimal required fields', () => {
      const minimalData = {
      id: 'appointment-2',
      patientId: 'patient-2',
      vetId: 'vet-2',
      date: new Date('2024-01-16T14:00:00Z'),
      duration: 60,
      reason: 'surgery' as const,
      status: 'confirmed' as const,
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };

      const appointment = new Appointment(minimalData);

      expect(appointment.id).toBe(minimalData.id);
    expect(appointment.patientId).toBe(minimalData.patientId);
    expect(appointment.vetId).toBe(minimalData.vetId);
    expect(appointment.date).toBe(minimalData.date);
    expect(appointment.duration).toBe(minimalData.duration);
    expect(appointment.reason).toBe(minimalData.reason);
    expect(appointment.status).toBe(minimalData.status);
    expect(appointment.notes).toBeUndefined();
    expect(appointment.estimatedCost).toBeUndefined();
    expect(appointment.createdAt).toBe(minimalData.createdAt);
    expect(appointment.updatedAt).toBe(minimalData.updatedAt);
    });
  });

  describe('validation', () => {
    it('should validate appointment reasons', () => {
    const validReasons = ['checkup', 'vaccination', 'surgery', 'emergency', 'consultation'];
    
    validReasons.forEach(reason => {
      const appointment = new Appointment({
        ...mockAppointmentData,
        reason: reason as any,
      });
      expect(appointment.reason).toBe(reason);
    });
  });

    it('should validate appointment statuses', () => {
      const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
      
      validStatuses.forEach(status => {
        const appointment = new Appointment({
          ...mockAppointmentData,
          status: status as any,
        });
        expect(appointment.status).toBe(status);
      });
    });

    it('should validate duration is positive', () => {
      expect(() => {
        new Appointment({
          ...mockAppointmentData,
          duration: 0,
        });
      }).toThrow('Duration must be a positive number');

      expect(() => {
        new Appointment({
          ...mockAppointmentData,
          duration: -15,
        });
      }).toThrow('Duration must be a positive number');
    });

    it('should validate scheduled date is not in the past', () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      
      const appointment = new Appointment({
        ...mockAppointmentData,
        date: pastDate,
        status: 'scheduled',
      });

      expect(() => {
        appointment.validateScheduledDate();
      }).toThrow('Scheduled date cannot be in the past');
    });
  });

  describe('business logic', () => {
    it('should calculate end time correctly', () => {
      const appointment = new Appointment(mockAppointmentData);
      const expectedEndTime = new Date(mockAppointmentData.date.getTime() + (mockAppointmentData.duration * 60 * 1000));
      
      expect(appointment.getEndTime()).toEqual(expectedEndTime);
    });

    it('should check if appointment is upcoming', () => {
      const futureAppointment = new Appointment({
      ...mockAppointmentData,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    });
    
    const pastAppointment = new Appointment({
      ...mockAppointmentData,
      date: new Date('2020-01-01T10:00:00Z'),
    });

      expect(futureAppointment.isUpcoming()).toBe(true);
      expect(pastAppointment.isUpcoming()).toBe(false);
    });

    it('should check if appointment can be cancelled', () => {
      const scheduledAppointment = new Appointment({
        ...mockAppointmentData,
        status: 'scheduled',
      });

      const completedAppointment = new Appointment({
        ...mockAppointmentData,
        status: 'completed',
      });

      const cancelledAppointment = new Appointment({
        ...mockAppointmentData,
        status: 'cancelled',
      });

      expect(scheduledAppointment.canBeCancelled()).toBe(true);
      expect(completedAppointment.canBeCancelled()).toBe(false);
      expect(cancelledAppointment.canBeCancelled()).toBe(false);
    });

    it('should update status correctly', () => {
      const appointment = new Appointment(mockAppointmentData);
      
      appointment.updateStatus('confirmed');
      expect(appointment.status).toBe('confirmed');
      expect(appointment.updatedAt).toBeInstanceOf(Date);
    });

    it('should not allow invalid status transitions', () => {
      const completedAppointment = new Appointment({
        ...mockAppointmentData,
        status: 'completed',
      });

      expect(() => {
        completedAppointment.updateStatus('scheduled');
      }).toThrow('Cannot change status from completed to scheduled');
    });
  });

  describe('serialization', () => {
    it('should convert to JSON correctly', () => {
      const appointment = new Appointment(mockAppointmentData);
      const json = appointment.toJSON();

      expect(json).toEqual({
      id: mockAppointmentData.id,
      patientId: mockAppointmentData.patientId,
      vetId: mockAppointmentData.vetId,
      date: mockAppointmentData.date.toISOString(),
      duration: mockAppointmentData.duration,
      reason: mockAppointmentData.reason,
      status: mockAppointmentData.status,
      notes: mockAppointmentData.notes,
      estimatedCost: mockAppointmentData.estimatedCost,
      createdAt: mockAppointmentData.createdAt.toISOString(),
      updatedAt: mockAppointmentData.updatedAt.toISOString(),
    });
    });

    it('should handle undefined notes in JSON conversion', () => {
      const appointmentWithoutNotes = new Appointment({
        ...mockAppointmentData,
        notes: undefined,
      });
      
      const json = appointmentWithoutNotes.toJSON();
      expect(json.notes).toBeUndefined();
    });
  });

  describe('comparison', () => {
    it('should check equality correctly', () => {
      const appointment1 = new Appointment(mockAppointmentData);
      const appointment2 = new Appointment(mockAppointmentData);
      const appointment3 = new Appointment({
        ...mockAppointmentData,
        id: 'different-id',
      });

      expect(appointment1.equals(appointment2)).toBe(true);
      expect(appointment1.equals(appointment3)).toBe(false);
    });
  });
});