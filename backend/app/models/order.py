"""
Order database models for SQLAlchemy ORM.
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Decimal, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ENUM
import uuid

Base = declarative_base()


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


class Order(Base):
    """Order model representing customer orders."""
    
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Order details
    total_amount = Column(Decimal(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(ENUM(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Shipping information
    shipping_address = Column(Text, nullable=False)
    billing_address = Column(Text, nullable=False)
    shipping_method = Column(String(100), nullable=False)
    shipping_cost = Column(Decimal(10, 2), default=0.00)
    
    # Delivery tracking
    delivery_status = Column(ENUM(DeliveryStatus), default=DeliveryStatus.NOT_SHIPPED)
    tracking_number = Column(String(100), nullable=True)
    carrier = Column(String(100), nullable=True)
    estimated_delivery_date = Column(DateTime, nullable=True)
    actual_delivery_date = Column(DateTime, nullable=True)
    
    # Order metadata
    notes = Column(Text, nullable=True)
    is_cancelled = Column(Boolean, default=False)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, order_number={self.order_number}, status={self.status})>"


class OrderItem(Base):
    """Order item model representing individual products in an order."""
    
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Item details
    product_name = Column(String(255), nullable=False)
    product_sku = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Decimal(10, 2), nullable=False)
    total_price = Column(Decimal(10, 2), nullable=False)
    
    # Product metadata at time of order
    product_variant = Column(String(255), nullable=True)
    product_options = Column(Text, nullable=True)  # JSON string
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, product_name={self.product_name}, quantity={self.quantity})>"


class OrderStatusHistory(Base):
    """Order status history model for tracking status changes."""
    
    __tablename__ = "order_status_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    
    # Status change details
    previous_status = Column(ENUM(OrderStatus), nullable=True)
    new_status = Column(ENUM(OrderStatus), nullable=False)
    changed_by = Column(UUID(as_uuid=True), nullable=True)  # User ID who made the change
    change_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Delivery tracking updates
    delivery_status = Column(ENUM(DeliveryStatus), nullable=True)
    tracking_info = Column(Text, nullable=True)  # JSON string with tracking details
    location = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
    
    def __repr__(self):
        return f"<OrderStatusHistory(id={self.id}, order_id={self.order_id}, new_status={self.new_status})>"