import { Prescription, RefillRequest, PrescriptionHistory } from '../types/prescription';

// Mock API service - replace with actual API calls
class PrescriptionService {
  private baseUrl = 'https://api.vetapp.com'; // Replace with actual API URL

  /**
   * Fetch prescriptions for a specific pet or all pets
   */
  async getPrescriptions(petId?: string): Promise<Prescription[]> {
    try {
      const url = petId 
        ? `${this.baseUrl}/prescriptions?petId=${petId}`
        : `${this.baseUrl}/prescriptions`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.prescriptions || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      // Return mock data for development
      return this.getMockPrescriptions(petId);
    }
  }

  /**
   * Get prescription details by ID
   */
  async getPrescriptionById(id: string): Promise<Prescription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.prescription;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }
  }

  /**
   * Request a prescription refill
   */
  async requestRefill(refillData: Omit<RefillRequest, 'id' | 'requestDate' | 'status'>): Promise<RefillRequest> {
    try {
      const requestPayload = {
        ...refillData,
        requestDate: new Date().toISOString(),
        status: 'pending' as const,
      };

      const response = await fetch(`${this.baseUrl}/prescriptions/refill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.refillRequest;
    } catch (error) {
      console.error('Error requesting refill:', error);
      // Return mock response for development
      return {
        id: Date.now().toString(),
        ...refillData,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };
    }
  }

  /**
   * Get refill requests for the user
   */
  async getRefillRequests(): Promise<RefillRequest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/refill-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.refillRequests || [];
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      return [];
    }
  }

  /**
   * Get prescription history
   */
  async getPrescriptionHistory(prescriptionId: string): Promise<PrescriptionHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/${prescriptionId}/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Error fetching prescription history:', error);
      return [];
    }
  }

  /**
   * Book appointment for prescription consultation
   */
  async bookPrescriptionConsultation(prescriptionId: string, appointmentData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments/prescription-consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          prescriptionId,
          ...appointmentData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking consultation:', error);
      throw error;
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    // Implement your authentication logic here
    return 'mock-auth-token';
  }

  /**
   * Mock data for development
   */
  private getMockPrescriptions(petId?: string): Prescription[] {
    const mockData: Prescription[] = [
      {
        id: '1',
        petId: 'pet1',
        petName: 'Buddy',
        medicationName: 'Amoxicillin',
        dosage: '250mg',
        frequency: 'Twice daily',
        instructions: 'Give with food. Complete full course.',
        prescribedDate: '2024-01-15T00:00:00Z',
        expiryDate: '2024-07-15T00:00:00Z',
        refillsRemaining: 2,
        totalRefills: 3,
        veterinarianName: 'Dr. Smith',
        veterinarianId: 'vet1',
        status: 'active',
        isRefillable: true,
        lastRefillDate: '2024-02-15T00:00:00Z',
      },
      {
        id: '2',
        petId: 'pet1',
        petName: 'Buddy',
        medicationName: 'Metacam',
        dosage: '1.5mg/ml',
        frequency: 'Once daily',
        instructions: 'Give with food to reduce stomach upset.',
        prescribedDate: '2024-02-01T00:00:00Z',
        expiryDate: '2024-05-01T00:00:00Z',
        refillsRemaining: 0,
        totalRefills: 1,
        veterinarianName: 'Dr. Johnson',
        veterinarianId: 'vet2',
        status: 'expired',
        isRefillable: false,
      },
    ];

    return petId ? mockData.filter(p => p.petId === petId) : mockData;
  }
}

export const prescriptionService = new PrescriptionService();