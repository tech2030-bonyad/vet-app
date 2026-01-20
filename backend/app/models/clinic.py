"""
Database models for clinic management system.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid

Base = declarative_base()

# Association table for clinic services
clinic_services = Table(
    'clinic_services',
    Base.metadata,
    Column('clinic_id', UUID(as_uuid=True), ForeignKey('clinics.id'), primary_key=True),
    Column('service_id', UUID(as_uuid=True), ForeignKey('services.id'), primary_key=True)
)

class Clinic(Base):
    """
    Clinic model representing healthcare facilities.
    """
    __tablename__ = "clinics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    website = Column(String(255))
    
    # Address information
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False, default="USA")
    
    # Location coordinates for distance calculations
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    
    # Clinic metadata
    is_active = Column(Boolean, default=True, index=True)
    license_number = Column(String(100), unique=True)
    specialties = Column(ARRAY(String), default=[])
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    operating_hours = relationship("OperatingHours", back_populates="clinic", cascade="all, delete-orphan")
    services = relationship("Service", secondary=clinic_services, back_populates="clinics")
    availability = relationship("ClinicAvailability", back_populates="clinic", cascade="all, delete-orphan")

class Service(Base):
    """
    Service model representing medical services offered by clinics.
    """
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100), nullable=False, index=True)
    duration_minutes = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    clinics = relationship("Clinic", secondary=clinic_services, back_populates="services")
    pricing = relationship("ServicePricing", back_populates="service", cascade="all, delete-orphan")

class ServicePricing(Base):
    """
    Service pricing model for clinic-specific service prices.
    """
    __tablename__ = "service_pricing"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey('clinics.id'), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey('services.id'), nullable=False)
    
    price = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    service = relationship("Service", back_populates="pricing")

class OperatingHours(Base):
    """
    Operating hours model for clinic schedules.
    """
    __tablename__ = "operating_hours"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey('clinics.id'), nullable=False)
    
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    open_time = Column(String(5), nullable=False)  # Format: "HH:MM"
    close_time = Column(String(5), nullable=False)  # Format: "HH:MM"
    is_closed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    clinic = relationship("Clinic", back_populates="operating_hours")

class ClinicAvailability(Base):
    """
    Clinic availability model for tracking real-time availability.
    """
    __tablename__ = "clinic_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey('clinics.id'), nullable=False)
    
    date = Column(DateTime, nullable=False, index=True)
    available_slots = Column(Integer, default=0)
    total_slots = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    clinic = relationship("Clinic", back_populates="availability")