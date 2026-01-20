"""
Prescription database models for SQLAlchemy ORM.
"""
from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Boolean, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class PrescriptionStatus(PyEnum):
    """Enumeration for prescription status."""
    ACTIVE = "active"
    EXPIRED = "expired"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RefillStatus(PyEnum):
    """Enumeration for refill request status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPENSED = "dispensed"


class Prescription(Base):
    """
    Prescription model for storing digital prescriptions.
    """
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String(50), unique=True, index=True, nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    
    # Medication details
    medication_name = Column(String(200), nullable=False)
    medication_strength = Column(String(100), nullable=True)
    medication_form = Column(String(100), nullable=True)  # tablet, liquid, injection, etc.
    
    # Prescription details
    dosage = Column(String(200), nullable=False)
    frequency = Column(String(200), nullable=False)
    duration = Column(String(200), nullable=False)
    quantity_prescribed = Column(Integer, nullable=False)
    quantity_dispensed = Column(Integer, default=0)
    refills_allowed = Column(Integer, default=0)
    refills_used = Column(Integer, default=0)
    
    # Instructions and notes
    instructions = Column(Text, nullable=True)
    veterinarian_notes = Column(Text, nullable=True)
    pharmacy_notes = Column(Text, nullable=True)
    
    # Status and dates
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.ACTIVE)
    prescribed_date = Column(Date, nullable=False, default=date.today)
    expiry_date = Column(Date, nullable=False)
    last_dispensed_date = Column(Date, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    pet = relationship("Pet", back_populates="prescriptions")
    veterinarian = relationship("User", foreign_keys=[veterinarian_id], back_populates="prescribed_medications")
    appointment = relationship("Appointment", back_populates="prescriptions")
    refill_requests = relationship("RefillRequest", back_populates="prescription", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Prescription(id={self.id}, medication={self.medication_name}, pet_id={self.pet_id})>"


class RefillRequest(Base):
    """
    Refill request model for tracking prescription refill requests.
    """
    __tablename__ = "refill_requests"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Pet owner
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)   # Veterinarian
    
    # Request details
    quantity_requested = Column(Integer, nullable=False)
    quantity_approved = Column(Integer, nullable=True)
    request_reason = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Status and dates
    status = Column(Enum(RefillStatus), default=RefillStatus.PENDING)
    requested_date = Column(DateTime, default=datetime.utcnow)
    reviewed_date = Column(DateTime, nullable=True)
    dispensed_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    prescription = relationship("Prescription", back_populates="refill_requests")
    requester = relationship("User", foreign_keys=[requested_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    def __repr__(self):
        return f"<RefillRequest(id={self.id}, prescription_id={self.prescription_id}, status={self.status})>"


# Additional models that would be referenced (simplified versions)
class Pet(Base):
    """Pet model (simplified for reference)."""
    __tablename__ = "pets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    prescriptions = relationship("Prescription", back_populates="pet")


class User(Base):
    """User model (simplified for reference)."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False)  # veterinarian, pet_owner, etc.
    
    # Relationships
    prescribed_medications = relationship("Prescription", foreign_keys=[Prescription.veterinarian_id])


class Appointment(Base):
    """Appointment model (simplified for reference)."""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    
    # Relationships
    prescriptions = relationship("Prescription", back_populates="appointment")