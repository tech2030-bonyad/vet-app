"""
Prescription model for the pet care application.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Prescription(Base):
    """
    Prescription model representing prescriptions in the system.
    
    Attributes:
        id: Primary key
        prescription_number: Unique prescription number
        dosage: Dosage instructions
        frequency: How often to administer
        duration_days: Duration of treatment in days
        quantity: Quantity prescribed
        instructions: Special instructions
        is_filled: Whether prescription has been filled
        filled_date: Date when prescription was filled
        expiry_date: Prescription expiry date
        veterinarian_id: Foreign key to the prescribing veterinarian
        pet_id: Foreign key to the pet
        product_id: Foreign key to the prescribed product
        appointment_id: Foreign key to the related appointment
        created_at: Timestamp when prescription was created
        updated_at: Timestamp when prescription was last updated
    """
    
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String(50), unique=True, index=True, nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)  # e.g., "twice daily", "every 8 hours"
    duration_days = Column(Integer, nullable=False)
    quantity = Column(Float, nullable=False)
    instructions = Column(Text)
    is_filled = Column(Boolean, default=False, nullable=False)
    filled_date = Column(DateTime(timezone=True))
    expiry_date = Column(DateTime(timezone=True), nullable=False)
    veterinarian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    veterinarian = relationship("User", back_populates="prescriptions")
    pet = relationship("Pet", back_populates="prescriptions")
    product = relationship("Product", back_populates="prescriptions")
    appointment = relationship("Appointment", back_populates="prescriptions")
    
    @property
    def is_expired(self) -> bool:
        """Check if prescription is expired."""
        from datetime import datetime
        return datetime.now() > self.expiry_date
    
    @property
    def is_valid(self) -> bool:
        """Check if prescription is valid (not expired and not filled)."""
        return not self.is_expired and not self.is_filled
    
    def fill_prescription(self) -> bool:
        """
        Mark prescription as filled.
        
        Returns:
            True if successful, False if already filled or expired
        """
        if self.is_filled or self.is_expired:
            return False
        
        from datetime import datetime
        self.is_filled = True
        self.filled_date = datetime.now()
        return True
    
    def __repr__(self) -> str:
        return f"<Prescription(id={self.id}, number='{self.prescription_number}', filled={self.is_filled})>"