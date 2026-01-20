export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  color: string;
  gender: 'male' | 'female';
  isNeutered: boolean;
  microchipId?: string;
  photos: string[];
  medicalHistory: MedicalRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'vaccination' | 'checkup' | 'surgery' | 'medication' | 'other';
  title: string;
  description: string;
  veterinarian?: string;
  cost?: number;
  attachments?: string[];
}

export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  color: string;
  gender: 'male' | 'female';
  isNeutered: boolean;
  microchipId?: string;
}