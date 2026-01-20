"""
Authentication business logic and utilities.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..models.user import User
from ..auth.hash_password import hash_password, verify_password
from ..auth.jwt_handler import (
    create_access_token, 
    create_reset_token, 
    create_verification_token,
    verify_token,
    get_token_expiry_time
)
from ..schemas.auth import UserRegistration, UserResponse, TokenResponse
from ..utils.email import send_verification_email, send_password_reset_email

# Security scheme for JWT
security = HTTPBearer()


class AuthService:
    """Service class for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def register_user(self, user_data: UserRegistration) -> dict:
        """
        Register a new user.
        
        Args:
            user_data (UserRegistration): User registration data
            
        Returns:
            dict: Success message and user info
            
        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        verification_token = create_verification_token(user_data.email)
        
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            verification_token=verification_token,
            is_verified=False
        )
        
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        
        # Send verification email
        try:
            send_verification_email(user_data.email, verification_token)
        except Exception as e:
            # Log the error but don't fail registration
            print(f"Failed to send verification email: {e}")
        
        return {
            "message": "User registered successfully",
            "detail": "Please check your email to verify your account"
        }
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with email and password.
        
        Args:
            email (str): User's email
            password (str): User's password
            
        Returns:
            Optional[User]: User object if authentication successful, None otherwise
        """
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    def login_user(self, email: str, password: str) -> TokenResponse:
        """
        Login a user and return JWT token.
        
        Args:
            email (str): User's email
            password (str): User's password
            
        Returns:
            TokenResponse: JWT token and user info
            
        Raises:
            HTTPException: If authentication fails
        """
        user = self.authenticate_user(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        
        return TokenResponse(
            access_token=access_token,
            expires_in=get_token_expiry_time(),
            user=UserResponse.from_orm(user)
        )
    
    def verify_email(self, token: str) -> dict:
        """
        Verify user's email with verification token.
        
        Args:
            token (str): Email verification token
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If token is invalid or user not found
        """
        try:
            payload = verify_token(token, "verification")
            email = payload.get("sub")
            
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            if user.is_verified:
                return {"message": "Email already verified"}
            
            user.is_verified = True
            user.verification_token = None
            self.db.commit()
            
            return {"message": "Email verified successfully"}
            
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
    
    def request_password_reset(self, email: str) -> dict:
        """
        Request password reset for a user.
        
        Args:
            email (str): User's email
            
        Returns:
            dict: Success message
        """
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists or not
            return {"message": "If the email exists, a reset link has been sent"}
        
        # Create reset token
        reset_token = create_reset_token(email)
        reset_expires = datetime.utcnow() + timedelta(minutes=15)
        
        user.reset_token = reset_token
        user.reset_token_expires = reset_expires
        self.db.commit()
        
        # Send password reset email
        try:
            send_password_reset_email(email, reset_token)
        except Exception as e:
            print(f"Failed to send password reset email: {e}")
        
        return {"message": "If the email exists, a reset link has been sent"}
    
    def reset_password(self, token: str, new_password: str) -> dict:
        """
        Reset user's password with reset token.
        
        Args:
            token (str): Password reset token
            new_password (str): New password
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = verify_token(token, "reset")
            email = payload.get("sub")
            
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Check if reset token matches and hasn't expired
            if (user.reset_token != token or 
                not user.reset_token_expires or 
                datetime.utcnow() > user.reset_token_expires):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired reset token"
                )
            
            # Update password
            user.hashed_password = hash_password(new_password)
            user.reset_token = None
            user.reset_token_expires = None
            self.db.commit()
            
            return {"message": "Password reset successfully"}
            
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """
        Get current authenticated user from JWT token.
        
        Args:
            credentials (HTTPAuthorizationCredentials): JWT credentials
            
        Returns:
            User: Current authenticated user
            
        Raises:
            HTTPException: If token is invalid or user not found
        """
        try:
            payload = verify_token(credentials.credentials, "access")
            email = payload.get("sub")
            
            if email is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is deactivated"
                )
            
            return user
            
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    
    def update_user_profile(self, user: User, update_data: dict) -> UserResponse:
        """
        Update user profile information.
        
        Args:
            user (User): Current user
            update_data (dict): Data to update
            
        Returns:
            UserResponse: Updated user information
        """
        for field, value in update_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        
        return UserResponse.from_orm(user)