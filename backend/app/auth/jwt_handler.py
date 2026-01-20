"""
JWT token handling utilities.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from jwt.exceptions import InvalidTokenError
import os
from fastapi import HTTPException, status

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))
VERIFICATION_TOKEN_EXPIRE_HOURS = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_HOURS", "24"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data (Dict[str, Any]): Data to encode in the token
        expires_delta (Optional[timedelta]): Token expiration time
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_reset_token(email: str) -> str:
    """
    Create a JWT token for password reset.
    
    Args:
        email (str): User's email address
        
    Returns:
        str: Encoded JWT reset token
    """
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "reset"
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_verification_token(email: str) -> str:
    """
    Create a JWT token for email verification.
    
    Args:
        email (str): User's email address
        
    Returns:
        str: Encoded JWT verification token
    """
    expire = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "verification"
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """
    Verify and decode a JWT token.
    
    Args:
        token (str): JWT token to verify
        token_type (str): Expected token type
        
    Returns:
        Dict[str, Any]: Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check token type
        if payload.get("type") != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Check expiration
        exp = payload.get("exp")
        if exp is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing expiration"
            )
        
        if datetime.utcnow() > datetime.fromtimestamp(exp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        
        return payload
        
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def get_token_expiry_time() -> int:
    """
    Get the access token expiry time in seconds.
    
    Returns:
        int: Token expiry time in seconds
    """
    return ACCESS_TOKEN_EXPIRE_MINUTES * 60