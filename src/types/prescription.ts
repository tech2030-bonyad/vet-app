export interface Prescription {
  id: string;
  petId: string;
  petName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  prescribedDate: string;
  expiryDate: string;
  refillsRemaining: number;
  totalRefills: number;
  veterinarianName: string;
  veterinarianId: string;
  status: 'active' | 'expired' | 'completed';
  isRefillable: boolean;
  lastRefillDate?: string;
}

export interface RefillRequest {
  id?: string;
  prescriptionId: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface PrescriptionHistory {
  id: string;
  prescriptionId: string;
  action: 'prescribed' | 'refilled' | 'expired' | 'completed';
  date: string;
  notes?: string;
  performedBy: string;
}