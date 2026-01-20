"""
Utility functions for checking appointment availability.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models.appointment import Appointment, ServiceProvider, AvailabilitySlot, AppointmentStatus
from ..schemas.appointment import AvailabilityCheckResponse, AppointmentResponse


class AvailabilityChecker:
    """Class for checking appointment availability and managing time slots."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
    
    def check_availability(
        self, 
        provider_id: UUID, 
        start_time: datetime, 
        end_time: datetime,
        exclude_appointment_id: Optional[UUID] = None
    ) -> AvailabilityCheckResponse:
        """
        Check if a time slot is available for booking.
        
        Args:
            provider_id: ID of the service provider
            start_time: Requested start time
            end_time: Requested end time
            exclude_appointment_id: Optional appointment ID to exclude from conflict check
            
        Returns:
            AvailabilityCheckResponse: Availability status and details
        """
        # Check if provider exists and is active
        provider = self.db.query(ServiceProvider).filter(
            and_(
                ServiceProvider.id == provider_id,
                ServiceProvider.is_active == True
            )
        ).first()
        
        if not provider:
            return AvailabilityCheckResponse(
                is_available=False,
                message="Service provider not found or inactive",
                conflicting_appointments=[]
            )
        
        # Check for conflicting appointments
        conflicting_query = self.db.query(Appointment).filter(
            and_(
                Appointment.provider_id == provider_id,
                Appointment.status.in_([
                    AppointmentStatus.PENDING,
                    AppointmentStatus.CONFIRMED
                ]),
                or_(
                    # New appointment starts during existing appointment
                    and_(
                        Appointment.start_time <= start_time,
                        Appointment.end_time > start_time
                    ),
                    # New appointment ends during existing appointment
                    and_(
                        Appointment.start_time < end_time,
                        Appointment.end_time >= end_time
                    ),
                    # New appointment completely contains existing appointment
                    and_(
                        Appointment.start_time >= start_time,
                        Appointment.end_time <= end_time
                    ),
                    # Existing appointment completely contains new appointment
                    and_(
                        Appointment.start_time <= start_time,
                        Appointment.end_time >= end_time
                    )
                )
            )
        )
        
        # Exclude specific appointment if provided (for rescheduling)
        if exclude_appointment_id:
            conflicting_query = conflicting_query.filter(
                Appointment.id != exclude_appointment_id
            )
        
        conflicting_appointments = conflicting_query.all()
        
        if conflicting_appointments:
            conflict_details = [
                AppointmentResponse.from_orm(apt) for apt in conflicting_appointments
            ]
            return AvailabilityCheckResponse(
                is_available=False,
                message=f"Time slot conflicts with {len(conflicting_appointments)} existing appointment(s)",
                conflicting_appointments=conflict_details
            )
        
        # Check provider availability slots (if implemented)
        if not self._check_provider_availability_slots(provider_id, start_time, end_time):
            return AvailabilityCheckResponse(
                is_available=False,
                message="Provider is not available during requested time",
                conflicting_appointments=[]
            )
        
        # Check business hours and other constraints
        if not self._check_business_constraints(start_time, end_time):
            return AvailabilityCheckResponse(
                is_available=False,
                message="Requested time is outside business hours or violates booking constraints",
                conflicting_appointments=[]
            )
        
        return AvailabilityCheckResponse(
            is_available=True,
            message="Time slot is available",
            conflicting_appointments=[]
        )
    
    def _check_provider_availability_slots(
        self, 
        provider_id: UUID, 
        start_time: datetime, 
        end_time: datetime
    ) -> bool:
        """
        Check if provider has availability slots covering the requested time.
        
        Args:
            provider_id: ID of the service provider
            start_time: Requested start time
            end_time: Requested end time
            
        Returns:
            bool: True if provider is available, False otherwise
        """
        # Query for availability slots that cover the requested time
        covering_slots = self.db.query(AvailabilitySlot).filter(
            and_(
                AvailabilitySlot.provider_id == provider_id,
                AvailabilitySlot.is_available == True,
                AvailabilitySlot.start_time <= start_time,
                AvailabilitySlot.end_time >= end_time
            )
        ).first()
        
        # If no specific availability slots are defined, assume provider is available
        # This allows for flexible scheduling when providers haven't set specific hours
        total_slots = self.db.query(AvailabilitySlot).filter(
            AvailabilitySlot.provider_id == provider_id
        ).count()
        
        if total_slots == 0:
            return True  # No restrictions defined
        
        return covering_slots is not None
    
    def _check_business_constraints(self, start_time: datetime, end_time: datetime) -> bool:
        """
        Check business rules and constraints for appointment booking.
        
        Args:
            start_time: Requested start time
            end_time: Requested end time
            
        Returns:
            bool: True if constraints are satisfied, False otherwise
        """
        # Check if appointment is in the past
        if start_time <= datetime.utcnow():
            return False
        
        # Check minimum advance booking time (e.g., 1 hour)
        min_advance_time = datetime.utcnow() + timedelta(hours=1)
        if start_time < min_advance_time:
            return False
        
        # Check maximum advance booking time (e.g., 90 days)
        max_advance_time = datetime.utcnow() + timedelta(days=90)
        if start_time > max_advance_time:
            return False
        
        # Check appointment duration constraints
        duration = end_time - start_time
        min_duration = timedelta(minutes=15)  # Minimum 15 minutes
        max_duration = timedelta(hours=4)     # Maximum 4 hours
        
        if duration < min_duration or duration > max_duration:
            return False
        
        # Check business hours (9 AM to 6 PM, Monday to Friday)
        if start_time.weekday() >= 5:  # Weekend
            return False
        
        if start_time.hour < 9 or end_time.hour > 18:
            return False
        
        return True
    
    def get_available_slots(
        self, 
        provider_id: UUID, 
        date: datetime, 
        duration_minutes: int = 60
    ) -> List[dict]:
        """
        Get available time slots for a specific date and provider.
        
        Args:
            provider_id: ID of the service provider
            date: Date to check for availability
            duration_minutes: Duration of appointment in minutes
            
        Returns:
            List[dict]: List of available time slots
        """
        # Define business hours
        business_start = date.replace(hour=9, minute=0, second=0, microsecond=0)
        business_end = date.replace(hour=18, minute=0, second=0, microsecond=0)
        
        # Get existing appointments for the date
        existing_appointments = self.db.query(Appointment).filter(
            and_(
                Appointment.provider_id == provider_id,
                Appointment.status.in_([
                    AppointmentStatus.PENDING,
                    AppointmentStatus.CONFIRMED
                ]),
                Appointment.start_time >= business_start,
                Appointment.start_time < business_end
            )
        ).order_by(Appointment.start_time).all()
        
        # Generate available slots
        available_slots = []
        slot_duration = timedelta(minutes=duration_minutes)
        current_time = business_start
        
        for appointment in existing_appointments:
            # Add slots before the appointment
            while current_time + slot_duration <= appointment.start_time:
                available_slots.append({
                    'start_time': current_time,
                    'end_time': current_time + slot_duration
                })
                current_time += timedelta(minutes=30)  # 30-minute intervals
            
            # Move current time to after the appointment
            current_time = max(current_time, appointment.end_time)
        
        # Add remaining slots after the last appointment
        while current_time + slot_duration <= business_end:
            available_slots.append({
                'start_time': current_time,
                'end_time': current_time + slot_duration
            })
            current_time += timedelta(minutes=30)
        
        return available_slots