import { Patient, Species, Gender } from './patient.entity';

describe('Patient Entity', () => {
  describe('constructor', () => {
    it('should create a patient with valid data', () => {
      const patientData = {
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
      };

      const patient = new Patient(patientData);

      expect(patient.id).toBe(patientData.id);
      expect(patient.name).toBe(patientData.name);
      expect(patient.species).toBe(patientData.species);
      expect(patient.breed).toBe(patientData.breed);
      expect(patient.gender).toBe(patientData.gender);
      expect(patient.birthDate).toBe(patientData.birthDate);
      expect(patient.ownerId).toBe(patientData.ownerId);
      expect(patient.tags).toEqual(patientData.tags);
      expect(patient.isActive).toBe(patientData.isActive);
      expect(patient.createdAt).toBe(patientData.createdAt);
      expect(patient.updatedAt).toBe(patientData.updatedAt);
    });

    it('should create a patient with default values', () => {
      const patientData = {
        id: 'patient-1',
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
        createdAt: new Date(),
      };

      const patient = new Patient(patientData);

      expect(patient.tags).toEqual([]);
      expect(patient.isActive).toBe(true);
      expect(patient.updatedAt).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should throw error for empty name', () => {
      const patientData = {
        id: 'patient-1',
        name: '',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
        createdAt: new Date(),
      };

      expect(() => new Patient(patientData)).toThrow('Name cannot be empty');
    });

    it('should throw error for invalid species', () => {
      const patientData = {
        id: 'patient-1',
        name: 'Buddy',
        species: 'invalid-species' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
        createdAt: new Date(),
      };

      expect(() => new Patient(patientData)).toThrow('Invalid species');
    });

    it('should throw error for invalid gender', () => {
      const patientData = {
        id: 'patient-1',
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'invalid-gender' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
        createdAt: new Date(),
      };

      expect(() => new Patient(patientData)).toThrow('Invalid gender');
    });

    it('should throw error for future birth date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const patientData = {
        id: 'patient-1',
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: futureDate,
        ownerId: 'owner-1',
        createdAt: new Date(),
      };

      expect(() => new Patient(patientData)).toThrow('Birth date cannot be in the future');
    });

    it('should throw error for empty owner ID', () => {
      const patientData = {
        id: 'patient-1',
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: '',
        createdAt: new Date(),
      };

      expect(() => new Patient(patientData)).toThrow('Owner ID cannot be empty');
    });
  });

  describe('business methods', () => {
    let patient: Patient;

    beforeEach(() => {
      const patientData = {
        id: 'patient-1',
        name: 'Buddy',
        species: 'dog' as Species,
        breed: 'Golden Retriever',
        gender: 'male' as Gender,
        birthDate: new Date('2020-01-01'),
        ownerId: 'owner-1',
        createdAt: new Date(),
      };
      patient = new Patient(patientData);
    });

    describe('getAge', () => {
      it('should calculate age correctly', () => {
        const age = patient.getAge();
        const expectedAge = new Date().getFullYear() - 2020;
        expect(age).toBe(expectedAge);
      });
    });

    describe('isSenior', () => {
      it('should return true for senior dogs (7+ years)', () => {
        const seniorDogData = {
          id: 'patient-1',
          name: 'Old Buddy',
          species: 'dog' as Species,
          breed: 'Golden Retriever',
          gender: 'male' as Gender,
          birthDate: new Date('2015-01-01'),
          ownerId: 'owner-1',
          createdAt: new Date(),
        };
        const seniorDog = new Patient(seniorDogData);
        expect(seniorDog.isSenior()).toBe(true);
      });

      it('should return false for young dogs', () => {
        expect(patient.isSenior()).toBe(false);
      });

      it('should return true for senior cats (10+ years)', () => {
        const seniorCatData = {
          id: 'patient-1',
          name: 'Old Cat',
          species: 'cat' as Species,
          breed: 'Persian',
          gender: 'female' as Gender,
          birthDate: new Date('2012-01-01'),
          ownerId: 'owner-1',
          createdAt: new Date(),
        };
        const seniorCat = new Patient(seniorCatData);
        expect(seniorCat.isSenior()).toBe(true);
      });
    });

    describe('addTag', () => {
      it('should add a new tag', () => {
        patient.addTag('vaccinated');
        expect(patient.tags).toContain('vaccinated');
      });

      it('should not add duplicate tags', () => {
        patient.addTag('vaccinated');
        patient.addTag('vaccinated');
        expect(patient.tags.filter(tag => tag === 'vaccinated')).toHaveLength(1);
      });
    });

    describe('removeTag', () => {
      it('should remove an existing tag', () => {
        patient.addTag('vaccinated');
        patient.removeTag('vaccinated');
        expect(patient.tags).not.toContain('vaccinated');
      });

      it('should not throw error when removing non-existent tag', () => {
        expect(() => patient.removeTag('non-existent')).not.toThrow();
      });
    });

    describe('deactivate', () => {
      it('should set isActive to false', () => {
        patient.deactivate();
        expect(patient.isActive).toBe(false);
      });
    });

    describe('activate', () => {
      it('should set isActive to true', () => {
        patient.deactivate();
        patient.activate();
        expect(patient.isActive).toBe(true);
      });
    });

    describe('toJSON', () => {
      it('should return a plain object representation', () => {
        const json = patient.toJSON();
        
        expect(json).toEqual({
          id: patient.id,
          name: patient.name,
          species: patient.species,
          breed: patient.breed,
          gender: patient.gender,
          birthDate: patient.birthDate,
          ownerId: patient.ownerId,
          tags: patient.tags,
          isActive: patient.isActive,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
        });
      });
    });
  });
});