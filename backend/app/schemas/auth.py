"""
Pydantic schemas for authentication requests and responses.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
import re


class UserRegistration(BaseModel):
    """Schema for user registration request."""
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=100, description="User's password")
    first_name: Optional[str] = Field(None, max_length=100, description="User's first name")
    last_name: Optional[str] = Field(None, max_length=100, description="User's last name")
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserLogin(BaseModel):
    """Schema for user login request."""
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserResponse(BaseModel):
    """Schema for user response."""
    
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response."""
    
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    
    email: EmailStr = Field(..., description="User's email address")


class PasswordReset(BaseModel):
    """Schema for password reset confirmation."""
    
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserUpdate(BaseModel):
    """Schema for user profile update."""
    
    first_name: Optional[str] = Field(None, max_length=100, description="User's first name")
    last_name: Optional[str] = Field(None, max_length=100, description="User's last name")


class EmailVerification(BaseModel):
    """Schema for email verification."""
    
    token: str = Field(..., description="Email verification token")


class Message(BaseModel):
    """Schema for general message responses."""
    
    message: str
    detail: Optional[str] = None