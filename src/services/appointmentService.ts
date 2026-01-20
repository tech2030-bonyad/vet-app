import { AppointmentBooking, Appointment, AvailabilityResponse, Service, Pet } from '../types/appointment';

// Mock API service - replace with actual API calls
class AppointmentService {
  private baseUrl = 'https://api.petcare.com'; // Replace with actual API URL

  /**
   * Fetch available time slots for a specific date and service
   */
  async getAvailableTimeSlots(date: string, serviceId: string): Promise<AvailabilityResponse> {
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      const mockTimeSlots = [
        { id: '1', time: '09:00', available: true, veterinarianName: 'Dr. Smith' },
        { id: '2', time: '10:00', available: false, veterinarianName: 'Dr. Johnson' },
        { id: '3', time: '11:00', available: true, veterinarianName: 'Dr. Smith' },
        { id: '4', time: '14:00', available: true, veterinarianName: 'Dr. Brown' },
        { id: '5', time: '15:00', available: true, veterinarianName: 'Dr. Johnson' },
        { id: '6', time: '16:00', available: false, veterinarianName: 'Dr. Smith' },
      ];

      return {
        date,
        timeSlots: mockTimeSlots,
      };
    } catch (error) {
      throw new Error('Failed to fetch available time slots');
    }
  }

  /**
   * Fetch all available services
   */
  async getServices(): Promise<Service[]> {
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        {
          id: '1',
          name: 'General Checkup',
          description: 'Comprehensive health examination',
          duration: 30,
          price: 75,
          category: 'medical',
        },
        {
          id: '2',
          name: 'Vaccination',
          description: 'Annual vaccination shots',
          duration: 15,
          price: 45,
          category: 'medical',
        },
        {
          id: '3',
          name: 'Grooming - Full Service',
          description: 'Bath, haircut, nail trimming',
          duration: 90,
          price: 120,
          category: 'grooming',
        },
        {
          id: '4',
          name: 'Dental Cleaning',
          description: 'Professional dental care',
          duration: 60,
          price: 200,
          category: 'medical',
        },
      ];
    } catch (error) {
      throw new Error('Failed to fetch services');
    }
  }

  /**
   * Fetch user's registered pets
   */
  async getUserPets(): Promise<Pet[]> {
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        {
          id: '1',
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 3,
          type: 'dog',
          imageUrl: 'https://example.com/buddy.jpg',
        },
        {
          id: '2',
          name: 'Whiskers',
          breed: 'Persian',
          age: 2,
          type: 'cat',
          imageUrl: 'https://example.com/whiskers.jpg',
        },
      ];
    } catch (error) {
      throw new Error('Failed to fetch pets');
    }
  }

  /**
   * Book an appointment
   */
  async bookAppointment(booking: AppointmentBooking): Promise<Appointment> {
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate booking creation
      const appointment: Appointment = {
        id: Date.now().toString(),
        ...booking,
        status: 'pending',
        createdAt: new Date().toISOString(),
        pet: {
          id: booking.petId,
          name: 'Buddy', // This would come from the actual pet data
          breed: 'Golden Retriever',
          age: 3,
          type: 'dog',
        },
        service: {
          id: booking.serviceId,
          name: 'General Checkup', // This would come from the actual service data
          description: 'Comprehensive health examination',
          duration: 30,
          price: 75,
          category: 'medical',
        },
        veterinarianName: 'Dr. Smith',
        totalPrice: 75,
      };

      return appointment;
    } catch (error) {
      throw new Error('Failed to book appointment');
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Appointment ${appointmentId} cancelled`);
    } catch (error) {
      throw new Error('Failed to cancel appointment');
    }
  }
}

export const appointmentService = new AppointmentService();