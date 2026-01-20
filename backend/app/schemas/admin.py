"""
Pydantic schemas for admin dashboard API requests and responses.
"""

from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    CLINIC_ADMIN = "clinic_admin"
    USER = "user"
    DOCTOR = "doctor"


class AppointmentStatus(str, Enum):
    """Appointment status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ProductStatus(str, Enum):
    """Product status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"


# Base schemas
class BaseResponse(BaseModel):
    """Base response schema"""
    success: bool = True
    message: str = "Operation successful"


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(10, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(None, description="Search query")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: Optional[str] = Field("asc", regex="^(asc|desc)$", description="Sort order")


# User management schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, regex=r"^\+?[\d\s\-\(\)]+$")
    role: UserRole = UserRole.USER


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, regex=r"^\+?[\d\s\-\(\)]+$")
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class UsersListResponse(BaseResponse):
    """Schema for users list response"""
    data: List[UserResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# Clinic management schemas
class ClinicBase(BaseModel):
    """Base clinic schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    address: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=50)
    zip_code: str = Field(..., min_length=1, max_length=20)
    phone: str = Field(..., regex=r"^\+?[\d\s\-\(\)]+$")
    email: Optional[EmailStr] = None
    website: Optional[str] = None


class ClinicCreate(ClinicBase):
    """Schema for creating a new clinic"""
    pass


class ClinicUpdate(BaseModel):
    """Schema for updating clinic information"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = Field(None, min_length=1)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=50)
    zip_code: Optional[str] = Field(None, min_length=1, max_length=20)
    phone: Optional[str] = Field(None, regex=r"^\+?[\d\s\-\(\)]+$")
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None


class ClinicResponse(ClinicBase):
    """Schema for clinic response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ClinicsListResponse(BaseResponse):
    """Schema for clinics list response"""
    data: List[ClinicResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# Product management schemas
class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    duration_minutes: Optional[int] = Field(None, gt=0)
    clinic_id: int = Field(..., gt=0)


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating product information"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    duration_minutes: Optional[int] = Field(None, gt=0)
    status: Optional[ProductStatus] = None
    is_featured: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int
    status: ProductStatus
    is_featured: bool
    created_at: datetime
    updated_at: Optional[datetime]
    clinic: ClinicResponse

    class Config:
        from_attributes = True


class ProductsListResponse(BaseResponse):
    """Schema for products list response"""
    data: List[ProductResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# Appointment management schemas
class AppointmentBase(BaseModel):
    """Base appointment schema"""
    user_id: int = Field(..., gt=0)
    clinic_id: int = Field(..., gt=0)
    product_id: int = Field(..., gt=0)
    appointment_date: date
    appointment_time: str = Field(..., regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    """Schema for creating a new appointment"""
    pass


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment information"""
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = Field(None, regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    """Schema for appointment response"""
    id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: Optional[datetime]
    user: UserResponse
    clinic: ClinicResponse
    product: ProductResponse

    class Config:
        from_attributes = True


class AppointmentsListResponse(BaseResponse):
    """Schema for appointments list response"""
    data: List[AppointmentResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# Analytics schemas
class DashboardStats(BaseModel):
    """Dashboard statistics schema"""
    total_users: int
    total_clinics: int
    total_products: int
    total_appointments: int
    active_users: int
    active_clinics: int
    pending_appointments: int
    completed_appointments: int


class RevenueStats(BaseModel):
    """Revenue statistics schema"""
    total_revenue: float
    monthly_revenue: float
    daily_revenue: float
    revenue_by_clinic: List[Dict[str, Any]]
    revenue_by_product: List[Dict[str, Any]]


class AppointmentStats(BaseModel):
    """Appointment statistics schema"""
    appointments_by_status: Dict[str, int]
    appointments_by_date: List[Dict[str, Any]]
    appointments_by_clinic: List[Dict[str, Any]]
    average_appointments_per_day: float


class UserStats(BaseModel):
    """User statistics schema"""
    users_by_role: Dict[str, int]
    new_users_by_date: List[Dict[str, Any]]
    user_activity: Dict[str, int]


class AnalyticsResponse(BaseResponse):
    """Analytics response schema"""
    dashboard_stats: DashboardStats
    revenue_stats: RevenueStats
    appointment_stats: AppointmentStats
    user_stats: UserStats


# Admin log schemas
class AdminLogResponse(BaseModel):
    """Admin log response schema"""
    id: int
    admin_id: int
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    admin: UserResponse

    class Config:
        from_attributes = True


class AdminLogsResponse(BaseResponse):
    """Admin logs list response schema"""
    data: List[AdminLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# Bulk operations schemas
class BulkUserUpdate(BaseModel):
    """Schema for bulk user updates"""
    user_ids: List[int] = Field(..., min_items=1)
    updates: UserUpdate


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete operations"""
    ids: List[int] = Field(..., min_items=1)


class BulkOperationResponse(BaseResponse):
    """Schema for bulk operation responses"""
    affected_count: int
    failed_ids: List[int] = []
    errors: List[str] = []