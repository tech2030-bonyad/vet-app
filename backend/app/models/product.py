"""
Product model for the pet care application.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class ProductCategory(enum.Enum):
    """Product category enumeration."""
    MEDICATION = "medication"
    FOOD = "food"
    SUPPLEMENT = "supplement"
    ACCESSORY = "accessory"
    TOY = "toy"
    GROOMING = "grooming"
    HEALTHCARE = "healthcare"
    OTHER = "other"


class Product(Base):
    """
    Product model representing products available in the system.
    
    Attributes:
        id: Primary key
        name: Product name
        description: Product description
        category: Product category
        brand: Product brand
        price: Product price
        stock_quantity: Available stock quantity
        sku: Stock Keeping Unit identifier
        is_prescription_required: Whether product requires prescription
        is_active: Whether product is currently available
        weight: Product weight in grams
        dosage_instructions: Instructions for medication dosage
        side_effects: Known side effects for medications
        created_at: Timestamp when product was added
        updated_at: Timestamp when product info was last updated
    """
    
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(Enum(ProductCategory), nullable=False)
    brand = Column(String(100))
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    is_prescription_required = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    weight = Column(Float)  # Weight in grams
    dosage_instructions = Column(Text)
    side_effects = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    prescriptions = relationship("Prescription", back_populates="product")
    
    @property
    def is_in_stock(self) -> bool:
        """Check if product is in stock."""
        return self.stock_quantity > 0
    
    def reduce_stock(self, quantity: int) -> bool:
        """
        Reduce stock quantity.
        
        Args:
            quantity: Quantity to reduce
            
        Returns:
            True if successful, False if insufficient stock
        """
        if self.stock_quantity >= quantity:
            self.stock_quantity -= quantity
            return True
        return False
    
    def increase_stock(self, quantity: int) -> None:
        """
        Increase stock quantity.
        
        Args:
            quantity: Quantity to add
        """
        self.stock_quantity += quantity
    
    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name='{self.name}', category='{self.category.value}')>"