"""
Product database models using SQLAlchemy.
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Decimal, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class PetType(str, Enum):
    """Enumeration for pet types."""
    CAT = "cat"
    DOG = "dog"
    BIRD = "bird"
    FISH = "fish"
    SMALL_ANIMAL = "small_animal"


class ProductCategory(str, Enum):
    """Enumeration for product categories."""
    DRY_FOOD = "dry_food"
    WET_FOOD = "wet_food"
    TREATS = "treats"
    SUPPLEMENTS = "supplements"
    TOYS = "toys"
    ACCESSORIES = "accessories"


class Product(Base):
    """
    Product model representing pet food and related products.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Decimal(10, 2), nullable=False)
    pet_type = Column(SQLEnum(PetType), nullable=False, index=True)
    category = Column(SQLEnum(ProductCategory), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    weight = Column(String(50), nullable=True)  # e.g., "2.5kg", "500g"
    ingredients = Column(Text, nullable=True)
    nutritional_info = Column(Text, nullable=True)
    stock_quantity = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', pet_type='{self.pet_type}')>"