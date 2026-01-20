"""
Pydantic schemas for appointment booking system.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, validator, Field
from enum import Enum


class AppointmentStatus(str, Enum):
    """Enum for appointment status."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    pass


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ServiceProviderBase(BaseModel):
    """Base service provider schema."""
    name: str
    email: EmailStr
    specialization: Optional[str] = None


class ServiceProviderResponse(ServiceProviderBase):
    """Schema for service provider response."""
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    """Base appointment schema."""
    provider_id: UUID
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        """Validate that end_time is after start_time."""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v
    
    @validator('start_time')
    def validate_start_time(cls, v):
        """Validate that start_time is in the future."""
        if v <= datetime.utcnow():
            raise ValueError('Start time must be in the future')
        return v


class AppointmentCreate(AppointmentBase):
    """Schema for creating an appointment."""
    pass


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    cancellation_reason: Optional[str] = None
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        """Validate that end_time is after start_time."""
        if 'start_time' in values and v and values['start_time'] and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v


class AppointmentResponse(AppointmentBase):
    """Schema for appointment response."""
    id: UUID
    user_id: UUID
    status: AppointmentStatus
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user: UserResponse
    provider: ServiceProviderResponse
    
    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """Schema for appointment list response."""
    appointments: List[AppointmentResponse]
    total: int
    page: int
    size: int


class AvailabilitySlotBase(BaseModel):
    """Base availability slot schema."""
    provider_id: UUID
    start_time: datetime
    end_time: datetime


class AvailabilitySlotResponse(AvailabilitySlotBase):
    """Schema for availability slot response."""
    id: UUID
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AvailabilityCheckRequest(BaseModel):
    """Schema for checking availability."""
    provider_id: UUID
    start_time: datetime
    end_time: datetime


class AvailabilityCheckResponse(BaseModel):
    """Schema for availability check response."""
    is_available: bool
    conflicting_appointments: List[AppointmentResponse] = []
    message: str


class AppointmentCancellationRequest(BaseModel):
    """Schema for appointment cancellation."""
    cancellation_reason: Optional[str] = Field(None, max_length=500)


class NotificationRequest(BaseModel):
    """Schema for notification requests."""
    appointment_id: UUID
    notification_type: str
    recipient_email: EmailStr