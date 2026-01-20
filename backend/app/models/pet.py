"""
Pet and Medical History database models.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Pet(Base):
    """Pet model for storing pet profile information."""
    
    __tablename__ = "pets"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    species: Mapped[str] = mapped_column(String(50), nullable=False)
    breed: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    microchip_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Foreign key to user (assuming you have a User model)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Profile photo path
    photo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    medical_records: Mapped[List["MedicalRecord"]] = relationship("MedicalRecord", back_populates="pet", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Pet(id={self.id}, name='{self.name}', species='{self.species}')>"


class MedicalRecord(Base):
    """Medical record model for tracking pet health history."""
    
    __tablename__ = "medical_records"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pet_id: Mapped[int] = mapped_column(Integer, ForeignKey("pets.id"), nullable=False)
    
    # Medical record details
    record_type: Mapped[str] = mapped_column(String(50), nullable=False)  # vaccination, checkup, treatment, etc.
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    veterinarian: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    clinic_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Dates
    record_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    next_due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Additional fields
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    pet: Mapped["Pet"] = relationship("Pet", back_populates="medical_records")
    
    def __repr__(self) -> str:
        return f"<MedicalRecord(id={self.id}, pet_id={self.pet_id}, type='{self.record_type}')>"


# User model (basic implementation for reference)
class User(Base):
    """User model for pet owners."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    pets: Mapped[List["Pet"]] = relationship("Pet", backref="owner", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"