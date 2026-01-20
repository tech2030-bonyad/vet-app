"""
Pydantic schemas for notification system.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field, validator

from ..models.notification import NotificationType, NotificationStatus


class NotificationPreferencesBase(BaseModel):
    """Base schema for notification preferences."""
    push_notifications_enabled: bool = True
    appointment_reminders: bool = True
    order_updates: bool = True
    prescription_refills: bool = True
    general_notifications: bool = True
    appointment_reminder_hours: int = Field(default=24, ge=1, le=168)  # 1 hour to 1 week
    prescription_refill_days: int = Field(default=3, ge=1, le=30)      # 1 to 30 days


class NotificationPreferencesCreate(NotificationPreferencesBase):
    """Schema for creating notification preferences."""
    fcm_token: Optional[str] = Field(None, max_length=255)
    device_type: Optional[str] = Field(None, regex="^(ios|android|web)$")


class NotificationPreferencesUpdate(BaseModel):
    """Schema for updating notification preferences."""
    push_notifications_enabled: Optional[bool] = None
    appointment_reminders: Optional[bool] = None
    order_updates: Optional[bool] = None
    prescription_refills: Optional[bool] = None
    general_notifications: Optional[bool] = None
    appointment_reminder_hours: Optional[int] = Field(None, ge=1, le=168)
    prescription_refill_days: Optional[int] = Field(None, ge=1, le=30)
    fcm_token: Optional[str] = Field(None, max_length=255)
    device_type: Optional[str] = Field(None, regex="^(ios|android|web)$")


class NotificationPreferencesResponse(NotificationPreferencesBase):
    """Schema for notification preferences response."""
    id: int
    user_id: UUID
    device_type: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    """Base schema for notifications."""
    type: NotificationType
    title: str = Field(..., max_length=255)
    body: str
    data: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    """Schema for creating notifications."""
    user_id: UUID
    scheduled_at: Optional[datetime] = None
    appointment_id: Optional[UUID] = None
    order_id: Optional[UUID] = None
    prescription_id: Optional[UUID] = None


class NotificationResponse(NotificationBase):
    """Schema for notification response."""
    id: UUID
    user_id: UUID
    status: NotificationStatus
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: int
    appointment_id: Optional[UUID]
    order_id: Optional[UUID]
    prescription_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    """Schema for updating notification status."""
    status: Optional[NotificationStatus] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None


class SendNotificationRequest(BaseModel):
    """Schema for sending immediate notifications."""
    user_ids: list[UUID]
    type: NotificationType
    title: str = Field(..., max_length=255)
    body: str
    data: Optional[Dict[str, Any]] = None


class NotificationStatsResponse(BaseModel):
    """Schema for notification statistics."""
    total_sent: int
    total_delivered: int
    total_read: int
    total_failed: int
    delivery_rate: float
    read_rate: float


class DeviceTokenRequest(BaseModel):
    """Schema for device token registration."""
    fcm_token: str = Field(..., max_length=255)
    device_type: str = Field(..., regex="^(ios|android|web)$")

    @validator('fcm_token')
    def validate_fcm_token(cls, v):
        """Validate FCM token format."""
        if not v or len(v.strip()) == 0:
            raise ValueError('FCM token cannot be empty')
        return v.strip()