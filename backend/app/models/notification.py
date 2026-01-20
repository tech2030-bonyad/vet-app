"""
Notification database models for push notification system.
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class NotificationType(PyEnum):
    """Enumeration for notification types."""
    APPOINTMENT_REMINDER = "appointment_reminder"
    ORDER_UPDATE = "order_update"
    PRESCRIPTION_REFILL = "prescription_refill"
    GENERAL = "general"


class NotificationStatus(PyEnum):
    """Enumeration for notification status."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DELIVERED = "delivered"
    READ = "read"


class UserNotificationPreference(Base):
    """User notification preferences model."""
    __tablename__ = "user_notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Push notification preferences
    push_notifications_enabled = Column(Boolean, default=True)
    appointment_reminders = Column(Boolean, default=True)
    order_updates = Column(Boolean, default=True)
    prescription_refills = Column(Boolean, default=True)
    general_notifications = Column(Boolean, default=True)
    
    # Timing preferences
    appointment_reminder_hours = Column(Integer, default=24)  # Hours before appointment
    prescription_refill_days = Column(Integer, default=3)     # Days before refill needed
    
    # Device tokens for push notifications
    fcm_token = Column(String(255), nullable=True)
    device_type = Column(String(20), nullable=True)  # 'ios', 'android', 'web'
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notification_preferences")


class Notification(Base):
    """Notification model for storing notification history."""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Notification details
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    data = Column(Text, nullable=True)  # JSON string for additional data
    
    # Status tracking
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING)
    
    # Scheduling
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Reference IDs for related entities
    appointment_id = Column(UUID(as_uuid=True), nullable=True)
    order_id = Column(UUID(as_uuid=True), nullable=True)
    prescription_id = Column(UUID(as_uuid=True), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")