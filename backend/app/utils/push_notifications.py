"""
Push notification utilities using Firebase Cloud Messaging.
"""
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, messaging
from pydantic import BaseModel

from ..core.config import settings


logger = logging.getLogger(__name__)


class PushNotificationPayload(BaseModel):
    """Push notification payload model."""
    title: str
    body: str
    data: Optional[Dict[str, str]] = None
    image_url: Optional[str] = None


class FCMService:
    """Firebase Cloud Messaging service for push notifications."""
    
    def __init__(self):
        """Initialize FCM service."""
        self._initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK."""
        try:
            if not firebase_admin._apps:
                # Initialize with service account key
                if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
                    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                    firebase_admin.initialize_app(cred)
                else:
                    # Initialize with service account JSON string
                    service_account_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                    cred = credentials.Certificate(service_account_info)
                    firebase_admin.initialize_app(cred)
                
                self._initialized = True
                logger.info("Firebase Admin SDK initialized successfully")
            else:
                self._initialized = True
                logger.info("Firebase Admin SDK already initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
            self._initialized = False
    
    async def send_notification(
        self,
        token: str,
        payload: PushNotificationPayload,
        android_config: Optional[Dict[str, Any]] = None,
        apns_config: Optional[Dict[str, Any]] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Send push notification to a single device.
        
        Args:
            token: FCM device token
            payload: Notification payload
            android_config: Android-specific configuration
            apns_config: iOS-specific configuration
            
        Returns:
            Tuple of (success, error_message)
        """
        if not self._initialized:
            return False, "FCM service not initialized"
        
        try:
            # Build notification
            notification = messaging.Notification(
                title=payload.title,
                body=payload.body,
                image=payload.image_url
            )
            
            # Build message
            message = messaging.Message(
                notification=notification,
                data=payload.data or {},
                token=token,
                android=self._build_android_config(android_config),
                apns=self._build_apns_config(apns_config)
            )
            
            # Send message
            response = messaging.send(message)
            logger.info(f"Successfully sent message: {response}")
            return True, None
            
        except messaging.UnregisteredError:
            error_msg = "Device token is unregistered"
            logger.warning(f"Unregistered token: {token}")
            return False, error_msg
            
        except messaging.InvalidArgumentError as e:
            error_msg = f"Invalid argument: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
            
        except Exception as e:
            error_msg = f"Failed to send notification: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def send_multicast_notification(
        self,
        tokens: List[str],
        payload: PushNotificationPayload,
        android_config: Optional[Dict[str, Any]] = None,
        apns_config: Optional[Dict[str, Any]] = None
    ) -> tuple[int, List[str]]:
        """
        Send push notification to multiple devices.
        
        Args:
            tokens: List of FCM device tokens
            payload: Notification payload
            android_config: Android-specific configuration
            apns_config: iOS-specific configuration
            
        Returns:
            Tuple of (success_count, failed_tokens)
        """
        if not self._initialized:
            return 0, tokens
        
        if not tokens:
            return 0, []
        
        try:
            # Build notification
            notification = messaging.Notification(
                title=payload.title,
                body=payload.body,
                image=payload.image_url
            )
            
            # Build multicast message
            message = messaging.MulticastMessage(
                notification=notification,
                data=payload.data or {},
                tokens=tokens,
                android=self._build_android_config(android_config),
                apns=self._build_apns_config(apns_config)
            )
            
            # Send multicast message
            response = messaging.send_multicast(message)
            
            # Process results
            failed_tokens = []
            for idx, result in enumerate(response.responses):
                if not result.success:
                    failed_tokens.append(tokens[idx])
                    logger.warning(f"Failed to send to token {tokens[idx]}: {result.exception}")
            
            success_count = response.success_count
            logger.info(f"Successfully sent {success_count}/{len(tokens)} notifications")
            
            return success_count, failed_tokens
            
        except Exception as e:
            error_msg = f"Failed to send multicast notification: {str(e)}"
            logger.error(error_msg)
            return 0, tokens
    
    def _build_android_config(self, config: Optional[Dict[str, Any]]) -> Optional[messaging.AndroidConfig]:
        """Build Android-specific configuration."""
        if not config:
            return messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='default'
                )
            )
        
        return messaging.AndroidConfig(**config)
    
    def _build_apns_config(self, config: Optional[Dict[str, Any]]) -> Optional[messaging.APNSConfig]:
        """Build iOS-specific configuration."""
        if not config:
            return messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1
                    )
                )
            )
        
        return messaging.APNSConfig(**config)
    
    async def validate_token(self, token: str) -> bool:
        """
        Validate FCM token by sending a test message.
        
        Args:
            token: FCM device token
            
        Returns:
            True if token is valid, False otherwise
        """
        if not self._initialized:
            return False
        
        try:
            # Create a minimal test message
            message = messaging.Message(
                data={'test': 'true'},
                token=token,
                dry_run=True  # Don't actually send
            )
            
            messaging.send(message)
            return True
            
        except messaging.UnregisteredError:
            return False
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return False


# Global FCM service instance
fcm_service = FCMService()


async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
    image_url: Optional[str] = None
) -> tuple[bool, Optional[str]]:
    """
    Convenience function to send push notification.
    
    Args:
        token: FCM device token
        title: Notification title
        body: Notification body
        data: Additional data payload
        image_url: Optional image URL
        
    Returns:
        Tuple of (success, error_message)
    """
    payload = PushNotificationPayload(
        title=title,
        body=body,
        data=data,
        image_url=image_url
    )
    
    return await fcm_service.send_notification(token, payload)


async def send_multicast_push_notification(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
    image_url: Optional[str] = None
) -> tuple[int, List[str]]:
    """
    Convenience function to send multicast push notification.
    
    Args:
        tokens: List of FCM device tokens
        title: Notification title
        body: Notification body
        data: Additional data payload
        image_url: Optional image URL
        
    Returns:
        Tuple of (success_count, failed_tokens)
    """
    payload = PushNotificationPayload(
        title=title,
        body=body,
        data=data,
        image_url=image_url
    )
    
    return await fcm_service.send_multicast_notification(tokens, payload)