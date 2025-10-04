export type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type Gender = 'male' | 'female' | 'unknown';

export interface PatientData {
  id: string;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  birthDate: Date;
  ownerId: string;
  tags?: string[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Patient {
  public readonly id: string;
  public readonly name: string;
  public readonly species: Species;
  public readonly breed: string;
  public readonly gender: Gender;
  public readonly birthDate: Date;
  public readonly ownerId: string;
  public readonly createdAt: Date;
  public updatedAt?: Date;
  
  private _tags: string[];
  private _isActive: boolean;

  constructor(data: PatientData) {
    this.validateData(data);
    
    this.id = data.id;
    this.name = data.name;
    this.species = data.species;
    this.breed = data.breed;
    this.gender = data.gender;
    this.birthDate = data.birthDate;
    this.ownerId = data.ownerId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    
    this._tags = data.tags || [];
    this._isActive = data.isActive !== undefined ? data.isActive : true;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get isActive(): boolean {
    return this._isActive;
  }

  private validateData(data: PatientData): void {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Name cannot be empty');
    }

    const validSpecies: Species[] = ['dog', 'cat', 'bird', 'rabbit', 'other'];
    if (!validSpecies.includes(data.species)) {
      throw new Error('Invalid species');
    }

    const validGenders: Gender[] = ['male', 'female', 'unknown'];
    if (!validGenders.includes(data.gender)) {
      throw new Error('Invalid gender');
    }

    if (data.birthDate > new Date()) {
      throw new Error('Birth date cannot be in the future');
    }

    if (!data.ownerId || data.ownerId.trim() === '') {
      throw new Error('Owner ID cannot be empty');
    }
  }

  getAge(): number {
    const today = new Date();
    const birthYear = this.birthDate.getFullYear();
    const currentYear = today.getFullYear();
    
    let age = currentYear - birthYear;
    
    // Adjust if birthday hasn't occurred this year
    const birthMonth = this.birthDate.getMonth();
    const birthDay = this.birthDate.getDate();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
      age--;
    }
    
    return age;
  }

  isSenior(): boolean {
    const age = this.getAge();
    
    switch (this.species) {
      case 'dog':
        return age >= 7;
      case 'cat':
        return age >= 10;
      case 'bird':
        return age >= 5;
      case 'rabbit':
        return age >= 6;
      default:
        return age >= 7; // Default for 'other' species
    }
  }

  addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    this._tags = this._tags.filter(t => t !== tag);
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      species: this.species,
      breed: this.breed,
      gender: this.gender,
      birthDate: this.birthDate,
      ownerId: this.ownerId,
      tags: this.tags,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}