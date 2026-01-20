"""
Appointment model for the pet care application.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class AppointmentStatus(enum.Enum):
    """Appointment status enumeration."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AppointmentType(enum.Enum):
    """Appointment type enumeration."""
    CHECKUP = "checkup"
    VACCINATION = "vaccination"
    SURGERY = "surgery"
    EMERGENCY = "emergency"
    CONSULTATION = "consultation"
    GROOMING = "grooming"
    DENTAL = "dental"
    OTHER = "other"


class Appointment(Base):
    """
    Appointment model representing appointments in the system.
    
    Attributes:
        id: Primary key
        appointment_date: Date and time of the appointment
        duration_minutes: Expected duration in minutes
        appointment_type: Type of appointment
        status: Current status of the appointment
        reason: Reason for the appointment
        notes: Additional notes about the appointment
        diagnosis: Veterinarian's diagnosis
        treatment: Treatment provided
        cost: Cost of the appointment
        client_id: Foreign key to the client (pet owner)
        pet_id: Foreign key to the pet
        veterinarian_id: Foreign key to the veterinarian
        clinic_id: Foreign key to the clinic
        created_at: Timestamp when appointment was created
        updated_at: Timestamp when appointment was last updated
    """
    
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)
    appointment_type = Column(Enum(AppointmentType), nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False)
    reason = Column(Text, nullable=False)
    notes = Column(Text)
    diagnosis = Column(Text)
    treatment = Column(Text)
    cost = Column(Float)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("User", foreign_keys=[client_id], back_populates="appointments_as_client")
    pet = relationship("Pet", back_populates="appointments")
    veterinarian = relationship("User", foreign_keys=[veterinarian_id], back_populates="appointments_as_vet")
    clinic = relationship("Clinic", back_populates="appointments")
    prescriptions = relationship("Prescription", back_populates="appointment", cascade="all, delete-orphan")
    
    @property
    def is_upcoming(self) -> bool:
        """Check if appointment is upcoming."""
        from datetime import datetime
        return self.appointment_date > datetime.now() and self.status in [
            AppointmentStatus.SCHEDULED, 
            AppointmentStatus.CONFIRMED
        ]
    
    @property
    def is_completed(self) -> bool:
        """Check if appointment is completed."""
        return self.status == AppointmentStatus.COMPLETED
    
    def can_be_cancelled(self) -> bool:
        """Check if appointment can be cancelled."""
        return self.status in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
    
    def __repr__(self) -> str:
        return f"<Appointment(id={self.id}, date='{self.appointment_date}', status='{self.status.value}')>"