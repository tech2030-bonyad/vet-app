"""
Pydantic schemas for prescription management API.
"""
from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, validator
from decimal import Decimal


class PrescriptionStatus(str, Enum):
    """Prescription status enumeration."""
    ACTIVE = "active"
    EXPIRED = "expired"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RefillStatus(str, Enum):
    """Refill request status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPENSED = "dispensed"


# Base schemas
class PrescriptionBase(BaseModel):
    """Base prescription schema with common fields."""
    medication_name: str = Field(..., min_length=1, max_length=200, description="Name of the medication")
    medication_strength: Optional[str] = Field(None, max_length=100, description="Strength of the medication")
    medication_form: Optional[str] = Field(None, max_length=100, description="Form of medication (tablet, liquid, etc.)")
    dosage: str = Field(..., min_length=1, max_length=200, description="Dosage instructions")
    frequency: str = Field(..., min_length=1, max_length=200, description="Frequency of administration")
    duration: str = Field(..., min_length=1, max_length=200, description="Duration of treatment")
    quantity_prescribed: int = Field(..., gt=0, description="Quantity prescribed")
    refills_allowed: int = Field(0, ge=0, description="Number of refills allowed")
    instructions: Optional[str] = Field(None, description="Special instructions for pet owner")
    veterinarian_notes: Optional[str] = Field(None, description="Private veterinarian notes")
    expiry_date: date = Field(..., description="Prescription expiry date")

    @validator('expiry_date')
    def expiry_date_must_be_future(cls, v):
        """Validate that expiry date is in the future."""
        if v <= date.today():
            raise ValueError('Expiry date must be in the future')
        return v

    @validator('quantity_prescribed')
    def quantity_must_be_positive(cls, v):
        """Validate that quantity is positive."""
        if v <= 0:
            raise ValueError('Quantity prescribed must be greater than 0')
        return v


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating a new prescription."""
    pet_id: int = Field(..., gt=0, description="ID of the pet")
    appointment_id: Optional[int] = Field(None, gt=0, description="Associated appointment ID")

    class Config:
        schema_extra = {
            "example": {
                "pet_id": 1,
                "appointment_id": 123,
                "medication_name": "Amoxicillin",
                "medication_strength": "250mg",
                "medication_form": "tablet",
                "dosage": "1 tablet",
                "frequency": "twice daily",
                "duration": "10 days",
                "quantity_prescribed": 20,
                "refills_allowed": 1,
                "instructions": "Give with food to reduce stomach upset",
                "veterinarian_notes": "Monitor for allergic reactions",
                "expiry_date": "2024-12-31"
            }
        }


class PrescriptionUpdate(BaseModel):
    """Schema for updating an existing prescription."""
    medication_strength: Optional[str] = Field(None, max_length=100)
    medication_form: Optional[str] = Field(None, max_length=100)
    dosage: Optional[str] = Field(None, min_length=1, max_length=200)
    frequency: Optional[str] = Field(None, min_length=1, max_length=200)
    duration: Optional[str] = Field(None, min_length=1, max_length=200)
    quantity_prescribed: Optional[int] = Field(None, gt=0)
    refills_allowed: Optional[int] = Field(None, ge=0)
    instructions: Optional[str] = None
    veterinarian_notes: Optional[str] = None
    pharmacy_notes: Optional[str] = None
    status: Optional[PrescriptionStatus] = None
    expiry_date: Optional[date] = None

    @validator('expiry_date')
    def expiry_date_must_be_future(cls, v):
        """Validate that expiry date is in the future."""
        if v and v <= date.today():
            raise ValueError('Expiry date must be in the future')
        return v


class PrescriptionResponse(PrescriptionBase):
    """Schema for prescription response."""
    id: int
    prescription_number: str
    pet_id: int
    veterinarian_id: int
    appointment_id: Optional[int]
    quantity_dispensed: int
    refills_used: int
    pharmacy_notes: Optional[str]
    status: PrescriptionStatus
    prescribed_date: date
    last_dispensed_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    created_by: int

    class Config:
        from_attributes = True


class PrescriptionSummary(BaseModel):
    """Schema for prescription summary (list view)."""
    id: int
    prescription_number: str
    medication_name: str
    medication_strength: Optional[str]
    status: PrescriptionStatus
    prescribed_date: date
    expiry_date: date
    refills_allowed: int
    refills_used: int
    pet_name: Optional[str]

    class Config:
        from_attributes = True


# Refill request schemas
class RefillRequestBase(BaseModel):
    """Base refill request schema."""
    quantity_requested: int = Field(..., gt=0, description="Quantity requested for refill")
    request_reason: Optional[str] = Field(None, description="Reason for refill request")

    @validator('quantity_requested')
    def quantity_must_be_positive(cls, v):
        """Validate that quantity is positive."""
        if v <= 0:
            raise ValueError('Quantity requested must be greater than 0')
        return v


class RefillRequestCreate(RefillRequestBase):
    """Schema for creating a refill request."""
    prescription_id: int = Field(..., gt=0, description="ID of the prescription")

    class Config:
        schema_extra = {
            "example": {
                "prescription_id": 1,
                "quantity_requested": 10,
                "request_reason": "Running low on medication"
            }
        }


class RefillRequestUpdate(BaseModel):
    """Schema for updating a refill request (by veterinarian)."""
    status: RefillStatus
    quantity_approved: Optional[int] = Field(None, gt=0)
    rejection_reason: Optional[str] = None

    @validator('quantity_approved')
    def quantity_must_be_positive(cls, v):
        """Validate that approved quantity is positive."""
        if v is not None and v <= 0:
            raise ValueError('Quantity approved must be greater than 0')
        return v

    @validator('rejection_reason')
    def rejection_reason_required_if_rejected(cls, v, values):
        """Require rejection reason if status is rejected."""
        if values.get('status') == RefillStatus.REJECTED and not v:
            raise ValueError('Rejection reason is required when rejecting a refill request')
        return v


class RefillRequestResponse(RefillRequestBase):
    """Schema for refill request response."""
    id: int
    prescription_id: int
    requested_by: int
    reviewed_by: Optional[int]
    quantity_approved: Optional[int]
    rejection_reason: Optional[str]
    status: RefillStatus
    requested_date: datetime
    reviewed_date: Optional[datetime]
    dispensed_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Prescription history schemas
class PrescriptionHistory(BaseModel):
    """Schema for prescription history."""
    prescriptions: List[PrescriptionSummary]
    total_count: int
    active_count: int
    expired_count: int

    class Config:
        from_attributes = True


# Prescription statistics schemas
class PrescriptionStats(BaseModel):
    """Schema for prescription statistics."""
    total_prescriptions: int
    active_prescriptions: int
    expired_prescriptions: int
    pending_refills: int
    expiring_soon: int  # Expiring within 30 days

    class Config:
        from_attributes = True


# Error response schemas
class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str
    error_code: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "detail": "Prescription not found",
                "error_code": "PRESCRIPTION_NOT_FOUND"
            }
        }


# Pagination schemas
class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=1000, description="Maximum number of records to return")


class PrescriptionFilter(BaseModel):
    """Schema for prescription filtering."""
    pet_id: Optional[int] = None
    status: Optional[PrescriptionStatus] = None
    medication_name: Optional[str] = None
    veterinarian_id: Optional[int] = None
    expiring_within_days: Optional[int] = Field(None, ge=1, le=365)
    prescribed_after: Optional[date] = None
    prescribed_before: Optional[date] = None