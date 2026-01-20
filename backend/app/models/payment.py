"""
Payment database models for SQLAlchemy.
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Decimal, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()


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


class Payment(Base):
    """Payment model for tracking all payment transactions."""
    
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Payment details
    amount = Column(Decimal(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="usd")
    status = Column(String(50), nullable=False, default=PaymentStatus.PENDING)
    payment_type = Column(String(50), nullable=False)
    
    # Related entity information
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    
    # Stripe metadata
    stripe_client_secret = Column(String(255), nullable=True)
    stripe_charge_id = Column(String(255), nullable=True)
    payment_method_id = Column(String(255), nullable=True)
    
    # Additional information
    description = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Refund information
    refunded_amount = Column(Decimal(10, 2), nullable=False, default=0)
    is_refundable = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="payments")
    product = relationship("Product", back_populates="payments")
    appointment = relationship("Appointment", back_populates="payments")
    refunds = relationship("PaymentRefund", back_populates="payment")


class PaymentRefund(Base):
    """Payment refund model for tracking refund transactions."""
    
    __tablename__ = "payment_refunds"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=False)
    stripe_refund_id = Column(String(255), unique=True, nullable=False)
    
    # Refund details
    amount = Column(Decimal(10, 2), nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    
    # Metadata
    description = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payment = relationship("Payment", back_populates="refunds")