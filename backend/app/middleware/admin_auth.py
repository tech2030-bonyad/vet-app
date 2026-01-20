"""
Admin authentication and authorization middleware.
"""

from fastapi import HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
import jwt
from datetime import datetime, timedelta
import logging
from functools import wraps

from ..database import get_db
from ..models.admin import User, UserRole, AdminLog
from ..core.config import settings

logger = logging.getLogger(__name__)

# JWT Security scheme
security = HTTPBearer()


class AdminAuthError(Exception):
    """Custom exception for admin authentication errors"""
    pass


class InsufficientPermissionsError(Exception):
    """Custom exception for insufficient permissions"""
    pass


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token for admin users.
    
    Args:
        data: Token payload data
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        AdminAuthError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise AdminAuthError("Invalid token payload")
        return payload
    except jwt.ExpiredSignatureError:
        raise AdminAuthError("Token has expired")
    except jwt.JWTError:
        raise AdminAuthError("Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP authorization credentials
        db: Database session
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        payload = verify_token(credentials.credentials)
        user_id: int = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except AdminAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current authenticated admin user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current admin user object
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.CLINIC_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin access required."
        )
    return current_user


async def get_current_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current authenticated super admin user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current super admin user object
        
    Raises:
        HTTPException: If user is not a super admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Super admin access required."
        )
    return current_user


def require_permissions(allowed_roles: List[UserRole]):
    """
    Decorator to require specific roles for endpoint access.
    
    Args:
        allowed_roles: List of allowed user roles
        
    Returns:
        Decorator function
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required roles: {[role.value for role in allowed_roles]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def log_admin_action(
    db: Session,
    admin_user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    request: Optional[Request] = None
) -> AdminLog:
    """
    Log admin actions for audit trail.
    
    Args:
        db: Database session
        admin_user: Admin user performing the action
        action: Action performed (create, update, delete, etc.)
        entity_type: Type of entity affected (user, clinic, product, etc.)
        entity_id: ID of the affected entity
        details: Additional details about the action
        request: HTTP request object for IP and user agent
        
    Returns:
        Created admin log entry
    """
    try:
        ip_address = None
        user_agent = None
        
        if request:
            # Get client IP address
            ip_address = request.client.host
            if "x-forwarded-for" in request.headers:
                ip_address = request.headers["x-forwarded-for"].split(",")[0].strip()
            elif "x-real-ip" in request.headers:
                ip_address = request.headers["x-real-ip"]
            
            # Get user agent
            user_agent = request.headers.get("user-agent", "")[:500]  # Limit length
        
        admin_log = AdminLog(
            admin_id=admin_user.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(admin_log)
        db.commit()
        db.refresh(admin_log)
        
        logger.info(f"Admin action logged: {admin_user.email} performed {action} on {entity_type} {entity_id}")
        
        return admin_log
        
    except Exception as e:
        logger.error(f"Failed to log admin action: {str(e)}")
        db.rollback()
        # Don't raise exception to avoid breaking the main operation
        return None


class RateLimiter:
    """Simple in-memory rate limiter for admin endpoints"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            key: Unique identifier (e.g., user_id, IP address)
            limit: Maximum number of requests allowed
            window: Time window in seconds
            
        Returns:
            True if request is allowed, False otherwise
        """
        now = datetime.utcnow()
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests outside the window
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if (now - req_time).total_seconds() < window
        ]
        
        # Check if limit is exceeded
        if len(self.requests[key]) >= limit:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()


def apply_rate_limit(limit: int = 100, window: int = 3600):
    """
    Apply rate limiting to admin endpoints.
    
    Args:
        limit: Maximum requests per window
        window: Time window in seconds (default: 1 hour)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user and request from kwargs
            current_user = kwargs.get('current_user')
            request = kwargs.get('request')
            
            if current_user and request:
                key = f"admin_{current_user.id}_{request.client.host}"
                
                if not rate_limiter.is_allowed(key, limit, window):
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Please try again later."
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Dependency for checking clinic admin permissions
async def check_clinic_access(
    clinic_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> bool:
    """
    Check if clinic admin has access to specific clinic.
    
    Args:
        clinic_id: ID of the clinic to check access for
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        True if access is allowed
        
    Raises:
        HTTPException: If access is denied
    """
    # Super admins have access to all clinics
    if current_user.role == UserRole.ADMIN:
        return True
    
    # Clinic admins only have access to their associated clinics
    if current_user.role == UserRole.CLINIC_ADMIN:
        from ..models.admin import ClinicUser
        
        clinic_association = db.query(ClinicUser).filter(
            ClinicUser.user_id == current_user.id,
            ClinicUser.clinic_id == clinic_id
        ).first()
        
        if not clinic_association:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You don't have permission to access this clinic."
            )
    
    return True