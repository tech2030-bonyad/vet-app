"""
Pydantic schemas for payment operations.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentType(str, Enum):
    """Payment type enumeration."""
    PRODUCT_PURCHASE = "product_purchase"
    APPOINTMENT_BOOKING = "appointment_booking"
    SUBSCRIPTION = "subscription"
    OTHER = "other"


class PaymentIntentCreateRequest(BaseModel):
    """Schema for creating a payment intent."""
    
    amount: Decimal = Field(..., gt=0, description="Payment amount in dollars")
    currency: str = Field(default="usd", description="Payment currency")
    payment_type: PaymentType = Field(..., description="Type of payment")
    product_id: Optional[str] = Field(None, description="Product ID for product purchases")
    appointment_id: Optional[str] = Field(None, description="Appointment ID for bookings")
    description: Optional[str] = Field(None, max_length=500, description="Payment description")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    @validator('currency')
    def validate_currency(cls, v):
        """Validate currency code."""
        allowed_currencies = ['usd', 'eur', 'gbp', 'cad', 'aud']
        if v.lower() not in allowed_currencies:
            raise ValueError(f"Currency must be one of: {', '.join(allowed_currencies)}")
        return v.lower()
    
    @validator('amount')
    def validate_amount(cls, v):
        """Validate payment amount."""
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        if v > 999999.99:
            raise ValueError("Amount cannot exceed $999,999.99")
        return v


class PaymentIntentResponse(BaseModel):
    """Schema for payment intent response."""
    
    payment_id: str = Field(..., description="Internal payment ID")
    client_secret: str = Field(..., description="Stripe client secret for frontend")
    amount: Decimal = Field(..., description="Payment amount")
    currency: str = Field(..., description="Payment currency")
    status: PaymentStatus = Field(..., description="Payment status")
    
    class Config:
        orm_mode = True


class PaymentConfirmRequest(BaseModel):
    """Schema for confirming a payment."""
    
    payment_intent_id: str = Field(..., description="Stripe payment intent ID")
    payment_method_id: Optional[str] = Field(None, description="Payment method ID")


class PaymentResponse(BaseModel):
    """Schema for payment response."""
    
    id: str = Field(..., description="Payment ID")
    stripe_payment_intent_id: str = Field(..., description="Stripe payment intent ID")
    amount: Decimal = Field(..., description="Payment amount")
    currency: str = Field(..., description="Payment currency")
    status: PaymentStatus = Field(..., description="Payment status")
    payment_type: PaymentType = Field(..., description="Payment type")
    description: Optional[str] = Field(None, description="Payment description")
    created_at: datetime = Field(..., description="Creation timestamp")
    confirmed_at: Optional[datetime] = Field(None, description="Confirmation timestamp")
    refunded_amount: Decimal = Field(..., description="Total refunded amount")
    
    class Config:
        orm_mode = True


class RefundCreateRequest(BaseModel):
    """Schema for creating a refund."""
    
    payment_id: str = Field(..., description="Payment ID to refund")
    amount: Optional[Decimal] = Field(None, gt=0, description="Refund amount (full refund if not specified)")
    reason: Optional[str] = Field(None, max_length=255, description="Refund reason")
    description: Optional[str] = Field(None, max_length=500, description="Refund description")
    
    @validator('amount')
    def validate_amount(cls, v):
        """Validate refund amount."""
        if v is not None and v <= 0:
            raise ValueError("Refund amount must be greater than 0")
        return v


class RefundResponse(BaseModel):
    """Schema for refund response."""
    
    id: str = Field(..., description="Refund ID")
    payment_id: str = Field(..., description="Original payment ID")
    stripe_refund_id: str = Field(..., description="Stripe refund ID")
    amount: Decimal = Field(..., description="Refund amount")
    reason: Optional[str] = Field(None, description="Refund reason")
    status: str = Field(..., description="Refund status")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        orm_mode = True


class PaymentHistoryResponse(BaseModel):
    """Schema for payment history response."""
    
    payments: List[PaymentResponse] = Field(..., description="List of payments")
    total_count: int = Field(..., description="Total number of payments")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")


class WebhookEvent(BaseModel):
    """Schema for Stripe webhook events."""
    
    id: str = Field(..., description="Event ID")
    type: str = Field(..., description="Event type")
    data: Dict[str, Any] = Field(..., description="Event data")
    created: int = Field(..., description="Event creation timestamp")