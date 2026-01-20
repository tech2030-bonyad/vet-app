"""
User model for the pet care application.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash
import enum
from ..database import Base


class UserRole(enum.Enum):
    """User role enumeration."""
    CLIENT = "client"
    VETERINARIAN = "veterinarian"
    ADMIN = "admin"
    CLINIC_STAFF = "clinic_staff"


class User(Base):
    """
    User model representing users in the system.
    
    Attributes:
        id: Primary key
        email: User's email address (unique)
        username: User's username (unique)
        password_hash: Hashed password
        first_name: User's first name
        last_name: User's last name
        phone: User's phone number
        address: User's address
        role: User's role in the system
        is_active: Whether the user account is active
        is_verified: Whether the user's email is verified
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    """
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    appointments_as_client = relationship(
        "Appointment", 
        foreign_keys="Appointment.client_id",
        back_populates="client",
        cascade="all, delete-orphan"
    )
    appointments_as_vet = relationship(
        "Appointment",
        foreign_keys="Appointment.veterinarian_id", 
        back_populates="veterinarian"
    )
    prescriptions = relationship("Prescription", back_populates="veterinarian")
    clinic = relationship("Clinic", back_populates="veterinarian", uselist=False)
    
    def set_password(self, password: str) -> None:
        """
        Set user password by hashing it.
        
        Args:
            password: Plain text password
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """
        Check if provided password matches user's password.
        
        Args:
            password: Plain text password to check
            
        Returns:
            True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value}')>"