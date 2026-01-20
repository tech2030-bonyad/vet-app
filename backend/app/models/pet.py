"""
Pet model for the pet care application.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class PetSpecies(enum.Enum):
    """Pet species enumeration."""
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    RABBIT = "rabbit"
    HAMSTER = "hamster"
    FISH = "fish"
    REPTILE = "reptile"
    OTHER = "other"


class PetGender(enum.Enum):
    """Pet gender enumeration."""
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"


class Pet(Base):
    """
    Pet model representing pets in the system.
    
    Attributes:
        id: Primary key
        name: Pet's name
        species: Pet's species
        breed: Pet's breed
        gender: Pet's gender
        birth_date: Pet's birth date
        weight: Pet's weight in kg
        color: Pet's color/markings
        microchip_id: Pet's microchip identification
        medical_notes: Medical notes about the pet
        owner_id: Foreign key to the pet's owner
        created_at: Timestamp when pet was registered
        updated_at: Timestamp when pet info was last updated
    """
    
    __tablename__ = "pets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    species = Column(Enum(PetSpecies), nullable=False)
    breed = Column(String(100))
    gender = Column(Enum(PetGender), default=PetGender.UNKNOWN)
    birth_date = Column(Date)
    weight = Column(Float)  # Weight in kg
    color = Column(String(100))
    microchip_id = Column(String(50), unique=True, index=True)
    medical_notes = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="pets")
    appointments = relationship("Appointment", back_populates="pet", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="pet", cascade="all, delete-orphan")
    
    @property
    def age_in_years(self) -> float:
        """
        Calculate pet's age in years.
        
        Returns:
            Age in years as float, or None if birth_date is not set
        """
        if not self.birth_date:
            return None
        
        from datetime import date
        today = date.today()
        age = today - self.birth_date
        return round(age.days / 365.25, 1)
    
    def __repr__(self) -> str:
        return f"<Pet(id={self.id}, name='{self.name}', species='{self.species.value}')>"