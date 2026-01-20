"""
Business logic service for appointment management.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from ..models.appointment import Appointment, User, ServiceProvider, AppointmentStatus, AvailabilitySlot
from ..schemas.appointment import (
    AppointmentCreate, 
    AppointmentUpdate, 
    AppointmentResponse,
    AvailabilityCheckResponse
)
from ..utils.availability import AvailabilityChecker
from ..utils.notifications import NotificationService


class AppointmentService:
    """Service class for appointment management operations."""
    
    def __init__(self, db: Session):
        """Initialize the appointment service with database session."""
        self.db = db
        self.availability_checker = AvailabilityChecker(db)
        self.notification_service = NotificationService()
    
    def create_appointment(
        self, 
        appointment_data: AppointmentCreate, 
        user_id: UUID
    ) -> AppointmentResponse:
        """
        Create a new appointment with availability checking.
        
        Args:
            appointment_data: Appointment creation data
            user_id: ID of the user creating the appointment
            
        Returns:
            AppointmentResponse: Created appointment details
            
        Raises:
            HTTPException: If appointment conflicts or validation fails
        """
        # Validate user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate provider exists
        provider = self.db.query(ServiceProvider).filter(
            ServiceProvider.id == appointment_data.provider_id
        ).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service provider not found"
            )
        
        # Check availability
        availability_result = self.availability_checker.check_availability(
            provider_id=appointment_data.provider_id,
            start_time=appointment_data.start_time,
            end_time=appointment_data.end_time
        )
        
        if not availability_result.is_available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Time slot not available: {availability_result.message}"
            )
        
        # Create appointment
        db_appointment = Appointment(
            user_id=user_id,
            provider_id=appointment_data.provider_id,
            start_time=appointment_data.start_time,
            end_time=appointment_data.end_time,
            notes=appointment_data.notes,
            status=AppointmentStatus.PENDING
        )
        
        self.db.add(db_appointment)
        self.db.commit()
        self.db.refresh(db_appointment)
        
        # Send confirmation email
        try:
            self.notification_service.send_booking_confirmation(
                appointment_id=db_appointment.id,
                user_email=user.email,
                provider_name=provider.name,
                start_time=appointment_data.start_time,
                end_time=appointment_data.end_time
            )
        except Exception as e:
            # Log error but don't fail the appointment creation
            print(f"Failed to send confirmation email: {str(e)}")
        
        return self._get_appointment_response(db_appointment)
    
    def get_user_appointments(
        self, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[AppointmentStatus] = None
    ) -> List[AppointmentResponse]:
        """
        Get appointments for a specific user.
        
        Args:
            user_id: ID of the user
            skip: Number of records to skip
            limit: Maximum number of records to return
            status_filter: Optional status filter
            
        Returns:
            List[AppointmentResponse]: List of user appointments
        """
        query = self.db.query(Appointment).filter(Appointment.user_id == user_id)
        
        if status_filter:
            query = query.filter(Appointment.status == status_filter)
        
        appointments = query.offset(skip).limit(limit).all()
        return [self._get_appointment_response(apt) for apt in appointments]
    
    def get_appointment_by_id(self, appointment_id: UUID, user_id: UUID) -> AppointmentResponse:
        """
        Get a specific appointment by ID.
        
        Args:
            appointment_id: ID of the appointment
            user_id: ID of the user (for authorization)
            
        Returns:
            AppointmentResponse: Appointment details
            
        Raises:
            HTTPException: If appointment not found or unauthorized
        """
        appointment = self.db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.user_id == user_id
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        return self._get_appointment_response(appointment)
    
    def update_appointment(
        self, 
        appointment_id: UUID, 
        user_id: UUID, 
        update_data: AppointmentUpdate
    ) -> AppointmentResponse:
        """
        Update an existing appointment.
        
        Args:
            appointment_id: ID of the appointment to update
            user_id: ID of the user (for authorization)
            update_data: Updated appointment data
            
        Returns:
            AppointmentResponse: Updated appointment details
            
        Raises:
            HTTPException: If appointment not found, unauthorized, or conflicts
        """
        appointment = self.db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.user_id == user_id
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check if appointment can be modified
        if appointment.status in [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify cancelled or completed appointments"
            )
        
        # If rescheduling, check availability
        if update_data.start_time or update_data.end_time:
            new_start = update_data.start_time or appointment.start_time
            new_end = update_data.end_time or appointment.end_time
            
            # Only check availability if times are actually changing
            if new_start != appointment.start_time or new_end != appointment.end_time:
                availability_result = self.availability_checker.check_availability(
                    provider_id=appointment.provider_id,
                    start_time=new_start,
                    end_time=new_end,
                    exclude_appointment_id=appointment_id
                )
                
                if not availability_result.is_available:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"New time slot not available: {availability_result.message}"
                    )
        
        # Update appointment fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(appointment, field, value)
        
        appointment.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(appointment)
        
        return self._get_appointment_response(appointment)
    
    def cancel_appointment(
        self, 
        appointment_id: UUID, 
        user_id: UUID, 
        cancellation_reason: Optional[str] = None
    ) -> AppointmentResponse:
        """
        Cancel an appointment.
        
        Args:
            appointment_id: ID of the appointment to cancel
            user_id: ID of the user (for authorization)
            cancellation_reason: Optional reason for cancellation
            
        Returns:
            AppointmentResponse: Cancelled appointment details
            
        Raises:
            HTTPException: If appointment not found or unauthorized
        """
        appointment = self.db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.user_id == user_id
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        if appointment.status == AppointmentStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment is already cancelled"
            )
        
        # Update appointment status
        appointment.status = AppointmentStatus.CANCELLED
        appointment.cancellation_reason = cancellation_reason
        appointment.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(appointment)
        
        # Send cancellation notification
        try:
            self.notification_service.send_cancellation_notification(
                appointment_id=appointment.id,
                user_email=appointment.user.email,
                provider_name=appointment.provider.name,
                start_time=appointment.start_time,
                cancellation_reason=cancellation_reason
            )
        except Exception as e:
            print(f"Failed to send cancellation email: {str(e)}")
        
        return self._get_appointment_response(appointment)
    
    def _get_appointment_response(self, appointment: Appointment) -> AppointmentResponse:
        """
        Convert appointment model to response schema.
        
        Args:
            appointment: Appointment model instance
            
        Returns:
            AppointmentResponse: Formatted appointment response
        """
        return AppointmentResponse.from_orm(appointment)