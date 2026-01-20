import { Clinic, Review, SearchFilters, Location } from '../types/clinic';

// Mock data for demonstration
const MOCK_CLINICS: Clinic[] = [
  {
    id: '1',
    name: 'City Medical Center',
    address: '123 Main St, Downtown, NY 10001',
    phone: '+1 (555) 123-4567',
    email: 'info@citymedical.com',
    website: 'https://citymedical.com',
    latitude: 40.7128,
    longitude: -74.0060,
    rating: 4.5,
    reviewCount: 128,
    image: 'https://via.placeholder.com/300x200',
    services: [
      { id: '1', name: 'General Consultation', price: '$50', duration: '30 min' },
      { id: '2', name: 'Blood Test', price: '$25', duration: '15 min' },
      { id: '3', name: 'X-Ray', price: '$100', duration: '20 min' },
    ],
    hours: {
      monday: { open: '08:00', close: '18:00', isClosed: false },
      tuesday: { open: '08:00', close: '18:00', isClosed: false },
      wednesday: { open: '08:00', close: '18:00', isClosed: false },
      thursday: { open: '08:00', close: '18:00', isClosed: false },
      friday: { open: '08:00', close: '17:00', isClosed: false },
      saturday: { open: '09:00', close: '15:00', isClosed: false },
      sunday: { open: '00:00', close: '00:00', isClosed: true },
    },
    description: 'Full-service medical center providing comprehensive healthcare services.',
    isOpen: true,
  },
  {
    id: '2',
    name: 'Family Health Clinic',
    address: '456 Oak Ave, Midtown, NY 10002',
    phone: '+1 (555) 987-6543',
    email: 'contact@familyhealth.com',
    latitude: 40.7589,
    longitude: -73.9851,
    rating: 4.2,
    reviewCount: 89,
    image: 'https://via.placeholder.com/300x200',
    services: [
      { id: '4', name: 'Pediatric Care', price: '$60', duration: '45 min' },
      { id: '5', name: 'Vaccination', price: '$30', duration: '10 min' },
      { id: '6', name: 'Health Checkup', price: '$80', duration: '60 min' },
    ],
    hours: {
      monday: { open: '07:00', close: '19:00', isClosed: false },
      tuesday: { open: '07:00', close: '19:00', isClosed: false },
      wednesday: { open: '07:00', close: '19:00', isClosed: false },
      thursday: { open: '07:00', close: '19:00', isClosed: false },
      friday: { open: '07:00', close: '19:00', isClosed: false },
      saturday: { open: '08:00', close: '16:00', isClosed: false },
      sunday: { open: '10:00', close: '14:00', isClosed: false },
    },
    description: 'Specialized in family medicine and pediatric care.',
    isOpen: true,
  },
  {
    id: '3',
    name: 'Emergency Care Plus',
    address: '789 Pine St, Uptown, NY 10003',
    phone: '+1 (555) 456-7890',
    email: 'emergency@careplus.com',
    latitude: 40.7831,
    longitude: -73.9712,
    rating: 4.8,
    reviewCount: 256,
    image: 'https://via.placeholder.com/300x200',
    services: [
      { id: '7', name: 'Emergency Care', price: '$200', duration: 'Variable' },
      { id: '8', name: 'Urgent Care', price: '$120', duration: '30 min' },
      { id: '9', name: 'Minor Surgery', price: '$500', duration: '90 min' },
    ],
    hours: {
      monday: { open: '00:00', close: '23:59', isClosed: false },
      tuesday: { open: '00:00', close: '23:59', isClosed: false },
      wednesday: { open: '00:00', close: '23:59', isClosed: false },
      thursday: { open: '00:00', close: '23:59', isClosed: false },
      friday: { open: '00:00', close: '23:59', isClosed: false },
      saturday: { open: '00:00', close: '23:59', isClosed: false },
      sunday: { open: '00:00', close: '23:59', isClosed: false },
    },
    description: '24/7 emergency and urgent care services.',
    isOpen: true,
  },
];

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    clinicId: '1',
    patientName: 'John D.',
    rating: 5,
    comment: 'Excellent service and very professional staff. Highly recommended!',
    date: '2024-01-15',
    verified: true,
  },
  {
    id: '2',
    clinicId: '1',
    patientName: 'Sarah M.',
    rating: 4,
    comment: 'Good experience overall. Wait time was reasonable.',
    date: '2024-01-10',
    verified: true,
  },
];

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if clinic is currently open
 */
const isClinicOpen = (clinic: Clinic): boolean => {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase() as keyof typeof clinic.hours;
  const dayHours = clinic.hours[currentDay];
  
  if (dayHours.isClosed) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(dayHours.open.replace(':', ''));
  const closeTime = parseInt(dayHours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
};

export class ClinicService {
  /**
   * Get nearby clinics based on user location
   */
  static async getNearbyclinics(
    userLocation: Location,
    radius: number = 10
  ): Promise<Clinic[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const clinicsWithDistance = MOCK_CLINICS.map(clinic => ({
        ...clinic,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          clinic.latitude,
          clinic.longitude
        ),
        isOpen: isClinicOpen(clinic),
      })).filter(clinic => clinic.distance <= radius);
      
      // Sort by distance
      return clinicsWithDistance.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error fetching nearby clinics:', error);
      throw new Error('Failed to fetch nearby clinics');
    }
  }

  /**
   * Search clinics with filters
   */
  static async searchClinics(
    userLocation: Location,
    filters: SearchFilters
  ): Promise<Clinic[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filteredClinics = MOCK_CLINICS.map(clinic => ({
        ...clinic,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          clinic.latitude,
          clinic.longitude
        ),
        isOpen: isClinicOpen(clinic),
      }));

      // Apply filters
      if (filters.query) {
        const query = filters.query.toLowerCase();
        filteredClinics = filteredClinics.filter(
          clinic =>
            clinic.name.toLowerCase().includes(query) ||
            clinic.address.toLowerCase().includes(query) ||
            clinic.services.some(service =>
              service.name.toLowerCase().includes(query)
            )
        );
      }

      if (filters.radius) {
        filteredClinics = filteredClinics.filter(
          clinic => clinic.distance <= filters.radius
        );
      }

      if (filters.minRating) {
        filteredClinics = filteredClinics.filter(
          clinic => clinic.rating >= filters.minRating
        );
      }

      if (filters.services.length > 0) {
        filteredClinics = filteredClinics.filter(clinic =>
          clinic.services.some(service =>
            filters.services.includes(service.name)
          )
        );
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'distance':
          filteredClinics.sort((a, b) => a.distance - b.distance);
          break;
        case 'rating':
          filteredClinics.sort((a, b) => b.rating - a.rating);
          break;
        case 'name':
          filteredClinics.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      return filteredClinics;
    } catch (error) {
      console.error('Error searching clinics:', error);
      throw new Error('Failed to search clinics');
    }
  }

  /**
   * Get clinic details by ID
   */
  static async getClinicById(id: string): Promise<Clinic | null> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const clinic = MOCK_CLINICS.find(c => c.id === id);
      if (!clinic) return null;
      
      return {
        ...clinic,
        isOpen: isClinicOpen(clinic),
      };
    } catch (error) {
      console.error('Error fetching clinic details:', error);
      throw new Error('Failed to fetch clinic details');
    }
  }

  /**
   * Get reviews for a clinic
   */
  static async getClinicReviews(clinicId: string): Promise<Review[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return MOCK_REVIEWS.filter(review => review.clinicId === clinicId);
    } catch (error) {
      console.error('Error fetching clinic reviews:', error);
      throw new Error('Failed to fetch clinic reviews');
    }
  }

  /**
   * Get all available services
   */
  static async getAvailableServices(): Promise<string[]> {
    try {
      const allServices = MOCK_CLINICS.flatMap(clinic =>
        clinic.services.map(service => service.name)
      );
      return [...new Set(allServices)];
    } catch (error) {
      console.error('Error fetching available services:', error);
      throw new Error('Failed to fetch available services');
    }
  }
}