"""
Notification service for managing push notifications.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models.notification import (
    Notification, 
    UserNotificationPreference, 
    NotificationType, 
    NotificationStatus
)
from ..schemas.notification import (
    NotificationCreate,
    NotificationPreferencesCreate,
    NotificationPreferencesUpdate,
    SendNotificationRequest
)
from ..utils.push_notifications import send_push_notification, send_multicast_push_notification
from ..database import get_db


logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications and user preferences."""
    
    def __init__(self, db: Session):
        """Initialize notification service."""
        self.db = db
    
    async def create_notification(
        self,
        notification_data: NotificationCreate
    ) -> Notification:
        """
        Create a new notification.
        
        Args:
            notification_data: Notification creation data
            
        Returns:
            Created notification
        """
        try:
            # Convert data dict to JSON string if provided
            data_json = None
            if notification_data.data:
                data_json = json.dumps(notification_data.data)
            
            notification = Notification(
                user_id=notification_data.user_id,
                type=notification_data.type,
                title=notification_data.title,
                body=notification_data.body,
                data=data_json,
                scheduled_at=notification_data.scheduled_at,
                appointment_id=notification_data.appointment_id,
                order_id=notification_data.order_id,
                prescription_id=notification_data.prescription_id
            )
            
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            
            logger.info(f"Created notification {notification.id} for user {notification.user_id}")
            return notification
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create notification: {str(e)}")
            raise
    
    async def send_notification(self, notification_id: UUID) -> bool:
        """
        Send a notification immediately.
        
        Args:
            notification_id: Notification ID
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id
            ).first()
            
            if not notification:
                logger.error(f"Notification {notification_id} not found")
                return False
            
            # Get user preferences
            preferences = self.get_user_preferences(notification.user_id)
            if not preferences or not preferences.fcm_token:
                logger.warning(f"No FCM token for user {notification.user_id}")
                notification.status = NotificationStatus.FAILED
                notification.error_message = "No FCM token available"
                self.db.commit()
                return False
            
            # Check if user has enabled this notification type
            if not self._is_notification_enabled(preferences, notification.type):
                logger.info(f"Notification type {notification.type} disabled for user {notification.user_id}")
                notification.status = NotificationStatus.FAILED
                notification.error_message = "Notification type disabled by user"
                self.db.commit()
                return False
            
            # Prepare notification data
            data = {}
            if notification.data:
                data = json.loads(notification.data)
            
            # Add notification metadata
            data.update({
                'notification_id': str(notification.id),
                'type': notification.type.value,
                'appointment_id': str(notification.appointment_id) if notification.appointment_id else '',
                'order_id': str(notification.order_id) if notification.order_id else '',
                'prescription_id': str(notification.prescription_id) if notification.prescription_id else ''
            })
            
            # Send push notification
            success, error_message = await send_push_notification(
                token=preferences.fcm_token,
                title=notification.title,
                body=notification.body,
                data=data
            )
            
            # Update notification status
            if success:
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                notification.error_message = None
            else:
                notification.status = NotificationStatus.FAILED
                notification.error_message = error_message
                notification.retry_count += 1
            
            self.db.commit()
            
            logger.info(f"Notification {notification_id} {'sent' if success else 'failed'}")
            return success
            
        except Exception as e:
            logger.error(f"Failed to send notification {notification_id}: {str(e)}")
            return False
    
    async def send_bulk_notification(
        self,
        request: SendNotificationRequest
    ) -> Dict[str, Any]:
        """
        Send notification to multiple users.
        
        Args:
            request: Bulk notification request
            
        Returns:
            Dictionary with send results
        """
        try:
            # Get user preferences with FCM tokens
            preferences = self.db.query(UserNotificationPreference).filter(
                and_(
                    UserNotificationPreference.user_id.in_(request.user_ids),
                    UserNotificationPreference.fcm_token.isnot(None),
                    UserNotificationPreference.push_notifications_enabled == True
                )
            ).all()
            
            # Filter users based on notification type preferences
            valid_tokens = []
            valid_user_ids = []
            
            for pref in preferences:
                if self._is_notification_enabled(pref, request.type):
                    valid_tokens.append(pref.fcm_token)
                    valid_user_ids.append(pref.user_id)
            
            if not valid_tokens:
                logger.warning("No valid FCM tokens found for bulk notification")
                return {
                    'total_users': len(request.user_ids),
                    'valid_tokens': 0,
                    'sent_count': 0,
                    'failed_count': 0
                }
            
            # Prepare notification data
            data = request.data or {}
            data.update({
                'type': request.type.value,
                'bulk_notification': 'true'
            })
            
            # Send multicast notification
            success_count, failed_tokens = await send_multicast_push_notification(
                tokens=valid_tokens,
                title=request.title,
                body=request.body,
                data=data
            )
            
            # Create notification records
            notifications = []
            for user_id in valid_user_ids:
                notification = Notification(
                    user_id=user_id,
                    type=request.type,
                    title=request.title,
                    body=request.body,
                    data=json.dumps(data) if data else None,
                    status=NotificationStatus.SENT,
                    sent_at=datetime.utcnow()
                )
                notifications.append(notification)
            
            self.db.add_all(notifications)
            self.db.commit()
            
            result = {
                'total_users': len(request.user_ids),
                'valid_tokens': len(valid_tokens),
                'sent_count': success_count,
                'failed_count': len(failed_tokens)
            }
            
            logger.info(f"Bulk notification sent: {result}")
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to send bulk notification: {str(e)}")
            raise
    
    def get_user_preferences(self, user_id: UUID) -> Optional[UserNotificationPreference]:
        """
        Get user notification preferences.
        
        Args:
            user_id: User ID
            
        Returns:
            User notification preferences or None
        """
        return self.db.query(UserNotificationPreference).filter(
            UserNotificationPreference.user_id == user_id
        ).first()
    
    def create_user_preferences(
        self,
        user_id: UUID,
        preferences_data: NotificationPreferencesCreate
    ) -> UserNotificationPreference:
        """
        Create user notification preferences.
        
        Args:
            user_id: User ID
            preferences_data: Preferences data
            
        Returns:
            Created preferences
        """
        try:
            preferences = UserNotificationPreference(
                user_id=user_id,
                **preferences_data.dict()
            )
            
            self.db.add(preferences)
            self.db.commit()
            self.db.refresh(preferences)
            
            logger.info(f"Created notification preferences for user {user_id}")
            return preferences
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create user preferences: {str(e)}")
            raise
    
    def update_user_preferences(
        self,
        user_id: UUID,
        preferences_data: NotificationPreferencesUpdate
    ) -> Optional[UserNotificationPreference]:
        """
        Update user notification preferences.
        
        Args:
            user_id: User ID
            preferences_data: Updated preferences data
            
        Returns:
            Updated preferences or None
        """
        try:
            preferences = self.get_user_preferences(user_id)
            if not preferences:
                return None
            
            # Update only provided fields
            update_data = preferences_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(preferences, field, value)
            
            preferences.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(preferences)
            
            logger.info(f"Updated notification preferences for user {user_id}")
            return preferences
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update user preferences: {str(e)}")
            raise
    
    def get_user_notifications(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        notification_type: Optional[NotificationType] = None
    ) -> List[Notification]:
        """
        Get user notifications with pagination.
        
        Args:
            user_id: User ID
            limit: Maximum number of notifications
            offset: Offset for pagination
            notification_type: Filter by notification type
            
        Returns:
            List of notifications
        """
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id
        )
        
        if notification_type:
            query = query.filter(Notification.type == notification_type)
        
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    
    def mark_notification_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        """
        Mark notification as read.
        
        Args:
            notification_id: Notification ID
            user_id: User ID
            
        Returns:
            True if marked successfully, False otherwise
        """
        try:
            notification = self.db.query(Notification).filter(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id
                )
            ).first()
            
            if not notification:
                return False
            
            notification.read_at = datetime.utcnow()
            notification.status = NotificationStatus.READ
            self.db.commit()
            
            logger.info(f"Marked notification {notification_id} as read")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to mark notification as read: {str(e)}")
            return False
    
    def get_pending_notifications(self) -> List[Notification]:
        """
        Get all pending notifications that should be sent.
        
        Returns:
            List of pending notifications
        """
        now = datetime.utcnow()
        return self.db.query(Notification).filter(
            and_(
                Notification.status == NotificationStatus.PENDING,
                or_(
                    Notification.scheduled_at.is_(None),
                    Notification.scheduled_at <= now
                )
            )
        ).all()
    
    def _is_notification_enabled(
        self,
        preferences: UserNotificationPreference,
        notification_type: NotificationType
    ) -> bool:
        """
        Check if notification type is enabled for user.
        
        Args:
            preferences: User notification preferences
            notification_type: Notification type
            
        Returns:
            True if enabled, False otherwise
        """
        if not preferences.push_notifications_enabled:
            return False
        
        type_mapping = {
            NotificationType.APPOINTMENT_REMINDER: preferences.appointment_reminders,
            NotificationType.ORDER_UPDATE: preferences.order_updates,
            NotificationType.PRESCRIPTION_REFILL: preferences.prescription_refills,
            NotificationType.GENERAL: preferences.general_notifications
        }
        
        return type_mapping.get(notification_type, False)


def get_notification_service(db: Session = next(get_db())) -> NotificationService:
    """Get notification service instance."""
    return NotificationService(db)