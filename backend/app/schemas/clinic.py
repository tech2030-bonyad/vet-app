"""
Pydantic schemas for clinic management API.
"""
from pydantic import BaseModel, Field, validator, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, time
from uuid import UUID
from enum import Enum

class DayOfWeek(int, Enum):
    """Enumeration for days of the week."""
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6

class ServiceCategory(str, Enum):
    """Enumeration for service categories."""
    GENERAL = "general"
    DENTAL = "dental"
    CARDIOLOGY = "cardiology"
    DERMATOLOGY = "dermatology"
    ORTHOPEDICS = "orthopedics"
    PEDIATRICS = "pediatrics"
    GYNECOLOGY = "gynecology"
    NEUROLOGY = "neurology"
    PSYCHIATRY = "psychiatry"
    RADIOLOGY = "radiology"

# Base schemas
class OperatingHoursBase(BaseModel):
    """Base schema for operating hours."""
    day_of_week: DayOfWeek = Field(..., description="Day of the week (0=Monday, 6=Sunday)")
    open_time: str = Field(..., regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Opening time in HH:MM format")
    close_time: str = Field(..., regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Closing time in HH:MM format")
    is_closed: bool = Field(default=False, description="Whether the clinic is closed on this day")

    @validator('close_time')
    def validate_close_time(cls, v, values):
        """Validate that close time is after open time."""
        if 'open_time' in values and not values.get('is_closed', False):
            open_hour, open_min = map(int, values['open_time'].split(':'))
            close_hour, close_min = map(int, v.split(':'))
            
            open_minutes = open_hour * 60 + open_min
            close_minutes = close_hour * 60 + close_min
            
            if close_minutes <= open_minutes:
                raise ValueError('Close time must be after open time')
        return v

class OperatingHoursCreate(OperatingHoursBase):
    """Schema for creating operating hours."""
    pass

class OperatingHoursUpdate(BaseModel):
    """Schema for updating operating hours."""
    open_time: Optional[str] = Field(None, regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    close_time: Optional[str] = Field(None, regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_closed: Optional[bool] = None

class OperatingHours(OperatingHoursBase):
    """Schema for operating hours response."""
    id: UUID
    clinic_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Service schemas
class ServiceBase(BaseModel):
    """Base schema for services."""
    name: str = Field(..., min_length=1, max_length=255, description="Service name")
    description: Optional[str] = Field(None, description="Service description")
    category: ServiceCategory = Field(..., description="Service category")
    duration_minutes: int = Field(default=30, ge=5, le=480, description="Service duration in minutes")
    is_active: bool = Field(default=True, description="Whether the service is active")

class ServiceCreate(ServiceBase):
    """Schema for creating services."""
    pass

class ServiceUpdate(BaseModel):
    """Schema for updating services."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[ServiceCategory] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    is_active: Optional[bool] = None

class ServicePricingBase(BaseModel):
    """Base schema for service pricing."""
    price: float = Field(..., ge=0, description="Service price")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="Currency code")
    is_active: bool = Field(default=True, description="Whether the pricing is active")

class ServicePricingCreate(ServicePricingBase):
    """Schema for creating service pricing."""
    service_id: UUID

class ServicePricingUpdate(BaseModel):
    """Schema for updating service pricing."""
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    is_active: Optional[bool] = None

class ServicePricing(ServicePricingBase):
    """Schema for service pricing response."""
    id: UUID
    clinic_id: UUID
    service_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Service(ServiceBase):
    """Schema for service response."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    pricing: List[ServicePricing] = []

    class Config:
        from_attributes = True

# Clinic schemas
class ClinicBase(BaseModel):
    """Base schema for clinics."""
    name: str = Field(..., min_length=1, max_length=255, description="Clinic name")
    description: Optional[str] = Field(None, description="Clinic description")
    phone: str = Field(..., regex=r"^\+?1?\d{9,15}$", description="Phone number")
    email: EmailStr = Field(..., description="Email address")
    website: Optional[str] = Field(None, description="Website URL")
    
    # Address fields
    address_line1: str = Field(..., min_length=1, max_length=255, description="Address line 1")
    address_line2: Optional[str] = Field(None, max_length=255, description="Address line 2")
    city: str = Field(..., min_length=1, max_length=100, description="City")
    state: str = Field(..., min_length=1, max_length=100, description="State")
    postal_code: str = Field(..., min_length=1, max_length=20, description="Postal code")
    country: str = Field(default="USA", min_length=1, max_length=100, description="Country")
    
    # Location coordinates
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    
    # Clinic metadata
    license_number: Optional[str] = Field(None, max_length=100, description="License number")
    specialties: List[str] = Field(default=[], description="Medical specialties")
    is_active: bool = Field(default=True, description="Whether the clinic is active")

class ClinicCreate(ClinicBase):
    """Schema for creating clinics."""
    operating_hours: List[OperatingHoursCreate] = Field(default=[], description="Operating hours")
    service_ids: List[UUID] = Field(default=[], description="Service IDs to associate with clinic")

class ClinicUpdate(BaseModel):
    """Schema for updating clinics."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    phone: Optional[str] = Field(None, regex=r"^\+?1?\d{9,15}$")
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    
    address_line1: Optional[str] = Field(None, min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=1, max_length=20)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    license_number: Optional[str] = Field(None, max_length=100)
    specialties: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ClinicAvailabilityBase(BaseModel):
    """Base schema for clinic availability."""
    date: datetime = Field(..., description="Availability date")
    available_slots: int = Field(default=0, ge=0, description="Available appointment slots")
    total_slots: int = Field(default=0, ge=0, description="Total appointment slots")
    is_available: bool = Field(default=True, description="Whether the clinic is available")

    @validator('available_slots')
    def validate_available_slots(cls, v, values):
        """Validate that available slots don't exceed total slots."""
        if 'total_slots' in values and v > values['total_slots']:
            raise ValueError('Available slots cannot exceed total slots')
        return v

class ClinicAvailability(ClinicAvailabilityBase):
    """Schema for clinic availability response."""
    id: UUID
    clinic_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Clinic(ClinicBase):
    """Schema for clinic response."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    operating_hours: List[OperatingHours] = []
    services: List[Service] = []
    availability: List[ClinicAvailability] = []
    distance_km: Optional[float] = Field(None, description="Distance from search location in kilometers")

    class Config:
        from_attributes = True

class ClinicSummary(BaseModel):
    """Schema for clinic summary (used in lists)."""
    id: UUID
    name: str
    phone: str
    email: str
    address_line1: str
    city: str
    state: str
    postal_code: str
    latitude: float
    longitude: float
    specialties: List[str]
    is_active: bool
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

# Search and filter schemas
class LocationSearch(BaseModel):
    """Schema for location-based search."""
    latitude: float = Field(..., ge=-90, le=90, description="Search latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Search longitude")
    radius_km: float = Field(default=10.0, ge=0.1, le=100.0, description="Search radius in kilometers")

class ClinicSearchFilters(BaseModel):
    """Schema for clinic search filters."""
    specialty: Optional[str] = Field(None, description="Filter by specialty")
    service_category: Optional[ServiceCategory] = Field(None, description="Filter by service category")
    is_active: bool = Field(default=True, description="Filter by active status")
    has_availability: Optional[bool] = Field(None, description="Filter by availability")

class ClinicSearchParams(BaseModel):
    """Schema for clinic search parameters."""
    location: Optional[LocationSearch] = Field(None, description="Location-based search")
    filters: Optional[ClinicSearchFilters] = Field(None, description="Search filters")
    limit: int = Field(default=20, ge=1, le=100, description="Number of results to return")
    offset: int = Field(default=0, ge=0, description="Number of results to skip")
    sort_by: str = Field(default="distance", description="Sort field (distance, name, created_at)")
    sort_order: str = Field(default="asc", regex="^(asc|desc)$", description="Sort order")

# Response schemas
class ClinicListResponse(BaseModel):
    """Schema for clinic list response."""
    clinics: List[ClinicSummary]
    total: int
    limit: int
    offset: int
    has_more: bool

class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None