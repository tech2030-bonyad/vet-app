"""
Product API routes for the pet food catalog.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductSearchFilters,
    PetType,
    ProductCategory
)
from ..services.product_service import ProductService
from ..utils.pagination import get_pagination_params, Paginator
from ..auth.dependencies import get_current_admin_user, get_current_user

router = APIRouter(prefix="/products", tags=["products"])


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    """Dependency to get product service instance."""
    return ProductService(db)


@router.get("/", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    pet_type: Optional[PetType] = Query(None, description="Filter by pet type"),
    category: Optional[ProductCategory] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    product_service: ProductService = Depends(get_product_service)
):
    """
    Get products with pagination, search, and filtering capabilities.
    
    - **page**: Page number (starts from 1)
    - **per_page**: Number of items per page (max 100)
    - **search**: Search term for name, description, and brand
    - **pet_type**: Filter by pet type (cat, dog, bird, fish, small_animal)
    - **category**: Filter by product category
    - **brand**: Filter by brand name
    - **min_price**: Minimum price filter
    - **max_price**: Maximum price filter
    - **is_active**: Filter by active status (default: true)
    """
    try:
        # Create filters object
        filters = ProductSearchFilters(
            search=search,
            pet_type=pet_type,
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            is_active=is_active
        )
        
        # Get products with pagination
        products, total, page, per_page, has_next, has_prev = product_service.get_products_with_filters(
            filters=filters,
            page=page,
            per_page=per_page
        )
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        
        return ProductListResponse(
            products=[ProductResponse.from_orm(product) for product in products],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    product_service: ProductService = Depends(get_product_service)
):
    """
    Get a specific product by ID.
    
    - **product_id**: The ID of the product to retrieve
    """
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    return ProductResponse.from_orm(product)


@router.get("/sku/{sku}", response_model=ProductResponse)
async def get_product_by_sku(
    sku: str,
    product_service: ProductService = Depends(get_product_service)
):
    """
    Get a specific product by SKU.
    
    - **sku**: The SKU of the product to retrieve
    """
    product = product_service.get_product_by_sku(sku)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with SKU '{sku}' not found"
        )
    
    return ProductResponse.from_orm(product)


@router.get("/search/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=20, description="Maximum number of suggestions"),
    product_service: ProductService = Depends(get_product_service)
):
    """
    Get product search suggestions.
    
    - **q**: Search query (minimum 2 characters)
    - **limit**: Maximum number of suggestions (max 20)
    """
    products = product_service.search_products(q, limit)
    
    return {
        "suggestions": [
            {
                "id": product.id,
                "name": product.name,
                "brand": product.brand,
                "pet_type": product.pet_type,
                "category": product.category,
                "price": float(product.price)
            }
            for product in products
        ]
    }


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    product_service: ProductService = Depends(get_product_service),
    current_user = Depends(get_current_admin_user)
):
    """
    Create a new product. Requires admin privileges.
    
    - **product_data**: Product information to create
    """
    try:
        product = product_service.create_product(product_data)
        return ProductResponse.from_orm(product)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    product_service: ProductService = Depends(get_product_service),
    current_user = Depends(get_current_admin_user)
):
    """
    Update an existing product. Requires admin privileges.
    
    - **product_id**: ID of the product to update
    - **product_data**: Updated product information
    """
    product = product_service.update_product(product_id, product_data)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    return ProductResponse.from_orm(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    hard_delete: bool = Query(False, description="Permanently delete the product"),
    product_service: ProductService = Depends(get_product_service),
    current_user = Depends(get_current_admin_user)
):
    """
    Delete a product. Requires admin privileges.
    
    - **product_id**: ID of the product to delete
    - **hard_delete**: If true, permanently delete; otherwise, soft delete (set inactive)
    """
    if hard_delete:
        success = product_service.hard_delete_product(product_id)
    else:
        success = product_service.delete_product(product_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )


@router.get("/stats/overview")
async def get_product_stats(
    product_service: ProductService = Depends(get_product_service),
    current_user = Depends(get_current_admin_user)
):
    """
    Get product statistics overview. Requires admin privileges.
    
    Returns statistics about products including counts by pet type and category.
    """
    return product_service.get_product_stats()


# Public endpoints for categories and pet types
@router.get("/meta/pet-types")
async def get_pet_types():
    """Get available pet types."""
    return {
        "pet_types": [
            {"value": pet_type.value, "label": pet_type.value.replace("_", " ").title()}
            for pet_type in PetType
        ]
    }


@router.get("/meta/categories")
async def get_categories():
    """Get available product categories."""
    return {
        "categories": [
            {"value": category.value, "label": category.value.replace("_", " ").title()}
            for category in ProductCategory
        ]
    }


@router.get("/meta/brands")
async def get_brands(
    product_service: ProductService = Depends(get_product_service)
):
    """Get available brands from active products."""
    brands = product_service.db.query(
        product_service.db.query(ProductService.__annotations__['db'].query(Product.brand))
        .filter(Product.is_active == True)
        .distinct()
        .all()
    )
    
    return {
        "brands": [brand[0] for brand in brands if brand[0]]
    }