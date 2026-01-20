"""
Pydantic schemas for product API request/response validation.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class PetType(str, Enum):
    """Pet type enumeration for validation."""
    CAT = "cat"
    DOG = "dog"
    BIRD = "bird"
    FISH = "fish"
    SMALL_ANIMAL = "small_animal"


class ProductCategory(str, Enum):
    """Product category enumeration for validation."""
    DRY_FOOD = "dry_food"
    WET_FOOD = "wet_food"
    TREATS = "treats"
    SUPPLEMENTS = "supplements"
    TOYS = "toys"
    ACCESSORIES = "accessories"


class ProductBase(BaseModel):
    """Base product schema with common fields."""
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Product price")
    pet_type: PetType = Field(..., description="Type of pet this product is for")
    category: ProductCategory = Field(..., description="Product category")
    brand: str = Field(..., min_length=1, max_length=100, description="Product brand")
    weight: Optional[str] = Field(None, max_length=50, description="Product weight")
    ingredients: Optional[str] = Field(None, description="Product ingredients")
    nutritional_info: Optional[str] = Field(None, description="Nutritional information")
    stock_quantity: int = Field(0, ge=0, description="Stock quantity")
    image_url: Optional[str] = Field(None, max_length=500, description="Product image URL")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock keeping unit")

    @validator('price')
    def validate_price(cls, v):
        """Validate price is positive and has max 2 decimal places."""
        if v <= 0:
            raise ValueError('Price must be positive')
        return v

    @validator('sku')
    def validate_sku(cls, v):
        """Validate SKU format."""
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('SKU must contain only alphanumeric characters, hyphens, and underscores')
        return v.upper()


class ProductCreate(ProductBase):
    """Schema for creating a new product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    pet_type: Optional[PetType] = None
    category: Optional[ProductCategory] = None
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    weight: Optional[str] = Field(None, max_length=50)
    ingredients: Optional[str] = None
    nutritional_info: Optional[str] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    image_url: Optional[str] = Field(None, max_length=500)

    @validator('price')
    def validate_price(cls, v):
        """Validate price is positive if provided."""
        if v is not None and v <= 0:
            raise ValueError('Price must be positive')
        return v


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for paginated product list response."""
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class ProductSearchFilters(BaseModel):
    """Schema for product search and filtering parameters."""
    search: Optional[str] = Field(None, description="Search in name and description")
    pet_type: Optional[PetType] = Field(None, description="Filter by pet type")
    category: Optional[ProductCategory] = Field(None, description="Filter by category")
    brand: Optional[str] = Field(None, description="Filter by brand")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")
    is_active: Optional[bool] = Field(True, description="Filter by active status")

    @validator('max_price')
    def validate_price_range(cls, v, values):
        """Validate that max_price is greater than min_price if both are provided."""
        if v is not None and 'min_price' in values and values['min_price'] is not None:
            if v <= values['min_price']:
                raise ValueError('max_price must be greater than min_price')
        return v