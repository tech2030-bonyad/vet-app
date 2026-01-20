import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, MedicalRecord } from '../types/pet';

class PetService {
  private readonly STORAGE_KEY = 'pets';

  /**
   * Get all pets from local storage
   */
  async getAllPets(): Promise<Pet[]> {
    try {
      const petsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return petsData ? JSON.parse(petsData) : [];
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw new Error('Failed to fetch pets');
    }
  }

  /**
   * Get a specific pet by ID
   */
  async getPetById(id: string): Promise<Pet | null> {
    try {
      const pets = await this.getAllPets();
      return pets.find(pet => pet.id === id) || null;
    } catch (error) {
      console.error('Error fetching pet:', error);
      throw new Error('Failed to fetch pet');
    }
  }

  /**
   * Create a new pet
   */
  async createPet(petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
    try {
      const pets = await this.getAllPets();
      const newPet: Pet = {
        ...petData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      pets.push(newPet);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(pets));
      return newPet;
    } catch (error) {
      console.error('Error creating pet:', error);
      throw new Error('Failed to create pet');
    }
  }

  /**
   * Update an existing pet
   */
  async updatePet(id: string, updateData: Partial<Pet>): Promise<Pet> {
    try {
      const pets = await this.getAllPets();
      const petIndex = pets.findIndex(pet => pet.id === id);

      if (petIndex === -1) {
        throw new Error('Pet not found');
      }

      const updatedPet = {
        ...pets[petIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      pets[petIndex] = updatedPet;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(pets));
      return updatedPet;
    } catch (error) {
      console.error('Error updating pet:', error);
      throw new Error('Failed to update pet');
    }
  }

  /**
   * Delete a pet
   */
  async deletePet(id: string): Promise<void> {
    try {
      const pets = await this.getAllPets();
      const filteredPets = pets.filter(pet => pet.id !== id);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPets));
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw new Error('Failed to delete pet');
    }
  }

  /**
   * Add a medical record to a pet
   */
  async addMedicalRecord(petId: string, record: Omit<MedicalRecord, 'id'>): Promise<{ petId: string; record: MedicalRecord }> {
    try {
      const pets = await this.getAllPets();
      const petIndex = pets.findIndex(pet => pet.id === petId);

      if (petIndex === -1) {
        throw new Error('Pet not found');
      }

      const newRecord: MedicalRecord = {
        ...record,
        id: this.generateId(),
      };

      pets[petIndex].medicalHistory.push(newRecord);
      pets[petIndex].updatedAt = new Date().toISOString();

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(pets));
      return { petId, record: newRecord };
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw new Error('Failed to add medical record');
    }
  }

  /**
   * Upload pet photo (mock implementation)
   * In a real app, this would upload to a cloud service
   */
  async uploadPhoto(uri: string): Promise<string> {
    try {
      // Mock implementation - in reality, you'd upload to AWS S3, Cloudinary, etc.
      // For now, we'll just return the local URI
      return uri;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const petService = new PetService();