"""
Clinic model for the pet care application.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Clinic(Base):
    """
    Clinic model representing veterinary clinics.
    
    Attributes:
        id: Primary key
        name: Clinic name
        address: Clinic address
        phone: Clinic phone number
        email: Clinic email address
        website: Clinic website URL
        description: Clinic description
        opening_time: Daily opening time
        closing_time: Daily closing time
        is_active: Whether the clinic is currently active
        veterinarian_id: Foreign key to the primary veterinarian
        created_at: Timestamp when clinic was registered
        updated_at: Timestamp when clinic info was last updated
    """
    
    __tablename__ = "clinics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255))
    website = Column(String(255))
    description = Column(Text)
    opening_time = Column(Time)
    closing_time = Column(Time)
    is_active = Column(Boolean, default=True, nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    veterinarian = relationship("User", back_populates="clinic")
    appointments = relationship("Appointment", back_populates="clinic")
    
    def __repr__(self) -> str:
        return f"<Clinic(id={self.id}, name='{self.name}')>"