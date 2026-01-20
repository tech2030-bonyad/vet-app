"""
Password hashing utilities using bcrypt.
"""
from passlib.context import CryptContext
from passlib.hash import bcrypt

# Create password context with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password (str): Plain text password to hash
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    Args:
        plain_password (str): Plain text password to verify
        hashed_password (str): Hashed password to verify against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def needs_update(hashed_password: str) -> bool:
    """
    Check if a hashed password needs to be updated.
    
    Args:
        hashed_password (str): Hashed password to check
        
    Returns:
        bool: True if password needs update, False otherwise
    """
    return pwd_context.needs_update(hashed_password)