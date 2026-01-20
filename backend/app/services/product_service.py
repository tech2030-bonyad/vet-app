"""
Product service layer containing business logic for product operations.
"""
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from fastapi import HTTPException, status

from ..models.product import Product, PetType, ProductCategory
from ..schemas.product import ProductCreate, ProductUpdate, ProductSearchFilters
from ..utils.pagination import Paginator


class ProductService:
    """Service class for product-related business logic."""
    
    def __init__(self, db: Session):
        """
        Initialize the product service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    def create_product(self, product_data: ProductCreate) -> Product:
        """
        Create a new product.
        
        Args:
            product_data: Product creation data
            
        Returns:
            Created product instance
            
        Raises:
            HTTPException: If SKU already exists
        """
        # Check if SKU already exists
        existing_product = self.db.query(Product).filter(
            Product.sku == product_data.sku.upper()
        ).first()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product_data.sku}' already exists"
            )
        
        # Create new product
        db_product = Product(**product_data.dict())
        db_product.sku = db_product.sku.upper()  # Ensure SKU is uppercase
        
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        
        return db_product
    
    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        """
        Get a product by its ID.
        
        Args:
            product_id: Product ID
            
        Returns:
            Product instance or None if not found
        """
        return self.db.query(Product).filter(Product.id == product_id).first()
    
    def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """
        Get a product by its SKU.
        
        Args:
            sku: Product SKU
            
        Returns:
            Product instance or None if not found
        """
        return self.db.query(Product).filter(Product.sku == sku.upper()).first()
    
    def update_product(self, product_id: int, product_data: ProductUpdate) -> Optional[Product]:
        """
        Update an existing product.
        
        Args:
            product_id: Product ID to update
            product_data: Updated product data
            
        Returns:
            Updated product instance or None if not found
        """
        db_product = self.get_product_by_id(product_id)
        if not db_product:
            return None
        
        # Update only provided fields
        update_data = product_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_product, field, value)
        
        self.db.commit()
        self.db.refresh(db_product)
        
        return db_product
    
    def delete_product(self, product_id: int) -> bool:
        """
        Delete a product (soft delete by setting is_active to False).
        
        Args:
            product_id: Product ID to delete
            
        Returns:
            True if product was deleted, False if not found
        """
        db_product = self.get_product_by_id(product_id)
        if not db_product:
            return False
        
        db_product.is_active = False
        self.db.commit()
        
        return True
    
    def hard_delete_product(self, product_id: int) -> bool:
        """
        Permanently delete a product from database.
        
        Args:
            product_id: Product ID to delete
            
        Returns:
            True if product was deleted, False if not found
        """
        db_product = self.get_product_by_id(product_id)
        if not db_product:
            return False
        
        self.db.delete(db_product)
        self.db.commit()
        
        return True
    
    def get_products_with_filters(
        self,
        filters: ProductSearchFilters,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Product], int, int, int, bool, bool]:
        """
        Get products with search and filtering capabilities.
        
        Args:
            filters: Search and filter parameters
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple of (products, total, page, per_page, has_next, has_prev)
        """
        query = self.db.query(Product)
        
        # Apply filters
        conditions = []
        
        # Active status filter
        if filters.is_active is not None:
            conditions.append(Product.is_active == filters.is_active)
        
        # Pet type filter
        if filters.pet_type:
            conditions.append(Product.pet_type == filters.pet_type)
        
        # Category filter
        if filters.category:
            conditions.append(Product.category == filters.category)
        
        # Brand filter
        if filters.brand:
            conditions.append(Product.brand.ilike(f"%{filters.brand}%"))
        
        # Price range filters
        if filters.min_price is not None:
            conditions.append(Product.price >= filters.min_price)
        
        if filters.max_price is not None:
            conditions.append(Product.price <= filters.max_price)
        
        # Search in name and description
        if filters.search:
            search_term = f"%{filters.search}%"
            search_condition = or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.brand.ilike(search_term)
            )
            conditions.append(search_condition)
        
        # Apply all conditions
        if conditions:
            query = query.filter(and_(*conditions))
        
        # Order by created_at descending
        query = query.order_by(Product.created_at.desc())
        
        # Apply pagination
        return Paginator.paginate_query(query, page, per_page)
    
    def get_product_stats(self) -> dict:
        """
        Get product statistics.
        
        Returns:
            Dictionary with product statistics
        """
        total_products = self.db.query(Product).count()
        active_products = self.db.query(Product).filter(Product.is_active == True).count()
        
        # Products by pet type
        pet_type_stats = self.db.query(
            Product.pet_type,
            func.count(Product.id).label('count')
        ).filter(Product.is_active == True).group_by(Product.pet_type).all()
        
        # Products by category
        category_stats = self.db.query(
            Product.category,
            func.count(Product.id).label('count')
        ).filter(Product.is_active == True).group_by(Product.category).all()
        
        # Low stock products (less than 10 items)
        low_stock_count = self.db.query(Product).filter(
            and_(Product.is_active == True, Product.stock_quantity < 10)
        ).count()
        
        return {
            "total_products": total_products,
            "active_products": active_products,
            "inactive_products": total_products - active_products,
            "low_stock_products": low_stock_count,
            "by_pet_type": {stat.pet_type: stat.count for stat in pet_type_stats},
            "by_category": {stat.category: stat.count for stat in category_stats}
        }
    
    def search_products(self, search_term: str, limit: int = 10) -> List[Product]:
        """
        Search products by name, description, or brand.
        
        Args:
            search_term: Search term
            limit: Maximum number of results
            
        Returns:
            List of matching products
        """
        search_pattern = f"%{search_term}%"
        
        return self.db.query(Product).filter(
            and_(
                Product.is_active == True,
                or_(
                    Product.name.ilike(search_pattern),
                    Product.description.ilike(search_pattern),
                    Product.brand.ilike(search_pattern)
                )
            )
        ).order_by(Product.name).limit(limit).all()