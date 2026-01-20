export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  imageUrl?: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: 'grooming' | 'medical' | 'boarding' | 'training';
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  veterinarianId?: string;
  veterinarianName?: string;
}

export interface AppointmentBooking {
  petId: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export interface Appointment extends AppointmentBooking {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  pet: Pet;
  service: Service;
  veterinarianName?: string;
  totalPrice: number;
}

export interface AvailabilityResponse {
  date: string;
  timeSlots: TimeSlot[];
}