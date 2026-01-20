export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating: number;
  reviewCount: number;
  image?: string;
  services: Service[];
  hours: OperatingHours;
  description?: string;
  isOpen?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Review {
  id: string;
  clinicId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SearchFilters {
  query: string;
  radius: number;
  services: string[];
  minRating: number;
  sortBy: 'distance' | 'rating' | 'name';
}