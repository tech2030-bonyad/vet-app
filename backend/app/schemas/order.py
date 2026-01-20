"""
Pydantic schemas for order management API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, validator
from enum import Enum


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class DeliveryStatus(str, Enum):
    """Delivery status enumeration."""
    NOT_SHIPPED = "not_shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED_DELIVERY = "failed_delivery"
    RETURNED = "returned"


class OrderItemCreate(BaseModel):
    """Schema for creating order items."""
    product_id: UUID
    product_name: str = Field(..., min_length=1, max_length=255)
    product_sku: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0)
    product_variant: Optional[str] = Field(None, max_length=255)
    product_options: Optional[Dict[str, Any]] = None
    
    @validator('unit_price')
    def validate_unit_price(cls, v):
        if v <= 0:
            raise ValueError('Unit price must be greater than 0')
        return round(v, 2)


class OrderItemResponse(BaseModel):
    """Schema for order item responses."""
    id: UUID
    product_id: UUID
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product_variant: Optional[str]
    product_options: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating orders."""
    items: List[OrderItemCreate] = Field(..., min_items=1)
    shipping_address: str = Field(..., min_length=10)
    billing_address: str = Field(..., min_length=10)
    shipping_method: str = Field(..., min_length=1, max_length=100)
    shipping_cost: Decimal = Field(default=Decimal('0.00'), ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('currency')
    def validate_currency(cls, v):
        return v.upper()
    
    @validator('shipping_cost')
    def validate_shipping_cost(cls, v):
        return round(v, 2)


class OrderUpdate(BaseModel):
    """Schema for updating orders."""
    status: Optional[OrderStatus] = None
    delivery_status: Optional[DeliveryStatus] = None
    tracking_number: Optional[str] = Field(None, max_length=100)
    carrier: Optional[str] = Field(None, max_length=100)
    estimated_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)


class OrderCancellation(BaseModel):
    """Schema for order cancellation."""
    reason: str = Field(..., min_length=5, max_length=500)
    refund_requested: bool = Field(default=False)


class OrderStatusHistoryResponse(BaseModel):
    """Schema for order status history responses."""
    id: UUID
    previous_status: Optional[OrderStatus]
    new_status: OrderStatus
    changed_by: Optional[UUID]
    change_reason: Optional[str]
    notes: Optional[str]
    delivery_status: Optional[DeliveryStatus]
    tracking_info: Optional[Dict[str, Any]]
    location: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Schema for order responses."""
    id: UUID
    order_number: str
    user_id: UUID
    total_amount: Decimal
    currency: str
    status: OrderStatus
    shipping_address: str
    billing_address: str
    shipping_method: str
    shipping_cost: Decimal
    delivery_status: DeliveryStatus
    tracking_number: Optional[str]
    carrier: Optional[str]
    estimated_delivery_date: Optional[datetime]
    actual_delivery_date: Optional[datetime]
    notes: Optional[str]
    is_cancelled: bool
    cancellation_reason: Optional[str]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    order_items: List[OrderItemResponse]
    
    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    """Schema for detailed order responses including status history."""
    status_history: List[OrderStatusHistoryResponse]


class OrderListResponse(BaseModel):
    """Schema for paginated order list responses."""
    orders: List[OrderResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class OrderFilters(BaseModel):
    """Schema for order filtering parameters."""
    status: Optional[OrderStatus] = None
    delivery_status: Optional[DeliveryStatus] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = Field(None, max_length=100)


class TrackingUpdate(BaseModel):
    """Schema for delivery tracking updates."""
    tracking_number: str = Field(..., min_length=1, max_length=100)
    carrier: str = Field(..., min_length=1, max_length=100)
    status: DeliveryStatus
    location: Optional[str] = Field(None, max_length=255)
    estimated_delivery: Optional[datetime] = None
    tracking_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=500)


class OrderSummary(BaseModel):
    """Schema for order summary statistics."""
    total_orders: int
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    total_revenue: Decimal
    average_order_value: Decimal