"""
Pydantic schemas for Pet Management API.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class GenderEnum(str, Enum):
    """Enum for pet gender options."""
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"


class RecordTypeEnum(str, Enum):
    """Enum for medical record types."""
    VACCINATION = "vaccination"
    CHECKUP = "checkup"
    TREATMENT = "treatment"
    SURGERY = "surgery"
    MEDICATION = "medication"
    EMERGENCY = "emergency"
    OTHER = "other"


# Pet Schemas
class PetBase(BaseModel):
    """Base schema for Pet with common fields."""
    name: str = Field(..., min_length=1, max_length=100, description="Pet's name")
    species: str = Field(..., min_length=1, max_length=50, description="Pet's species (dog, cat, etc.)")
    breed: Optional[str] = Field(None, max_length=100, description="Pet's breed")
    age: Optional[int] = Field(None, ge=0, le=50, description="Pet's age in years")
    weight: Optional[float] = Field(None, ge=0, le=500, description="Pet's weight in kg")
    color: Optional[str] = Field(None, max_length=50, description="Pet's color")
    gender: Optional[GenderEnum] = Field(None, description="Pet's gender")
    microchip_id: Optional[str] = Field(None, max_length=50, description="Microchip ID")
    description: Optional[str] = Field(None, max_length=1000, description="Pet description")

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @validator('species')
    def validate_species(cls, v):
        if not v or not v.strip():
            raise ValueError('Species cannot be empty')
        return v.strip().lower()


class PetCreate(PetBase):
    """Schema for creating a new pet."""
    pass


class PetUpdate(BaseModel):
    """Schema for updating a pet (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=50)
    weight: Optional[float] = Field(None, ge=0, le=500)
    color: Optional[str] = Field(None, max_length=50)
    gender: Optional[GenderEnum] = None
    microchip_id: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None


class PetResponse(PetBase):
    """Schema for pet response."""
    id: int
    owner_id: int
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PetWithMedicalRecords(PetResponse):
    """Schema for pet response with medical records."""
    medical_records: List["MedicalRecordResponse"] = []


# Medical Record Schemas
class MedicalRecordBase(BaseModel):
    """Base schema for Medical Record."""
    record_type: RecordTypeEnum = Field(..., description="Type of medical record")
    title: str = Field(..., min_length=1, max_length=200, description="Record title")
    description: Optional[str] = Field(None, max_length=2000, description="Detailed description")
    veterinarian: Optional[str] = Field(None, max_length=100, description="Veterinarian name")
    clinic_name: Optional[str] = Field(None, max_length=100, description="Clinic name")
    record_date: datetime = Field(..., description="Date of the medical record")
    next_due_date: Optional[datetime] = Field(None, description="Next due date (for vaccinations, etc.)")
    cost: Optional[float] = Field(None, ge=0, description="Cost of the treatment/service")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes")

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('next_due_date')
    def validate_next_due_date(cls, v, values):
        if v and 'record_date' in values and v <= values['record_date']:
            raise ValueError('Next due date must be after record date')
        return v


class MedicalRecordCreate(MedicalRecordBase):
    """Schema for creating a medical record."""
    pass


class MedicalRecordUpdate(BaseModel):
    """Schema for updating a medical record."""
    record_type: Optional[RecordTypeEnum] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    veterinarian: Optional[str] = Field(None, max_length=100)
    clinic_name: Optional[str] = Field(None, max_length=100)
    record_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=2000)


class MedicalRecordResponse(MedicalRecordBase):
    """Schema for medical record response."""
    id: int
    pet_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# File Upload Schemas
class FileUploadResponse(BaseModel):
    """Schema for file upload response."""
    filename: str
    file_path: str
    file_size: int
    content_type: str
    upload_timestamp: datetime


# Error Schemas
class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str
    message: str
    details: Optional[dict] = None


class ValidationErrorResponse(BaseModel):
    """Schema for validation error responses."""
    error: str = "validation_error"
    message: str
    details: List[dict]


# Update forward references
PetWithMedicalRecords.model_rebuild()