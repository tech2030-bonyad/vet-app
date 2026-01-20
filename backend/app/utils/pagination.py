"""
Pagination utilities for API endpoints.
"""
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query
from math import ceil

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters schema."""
    page: int = Field(1, ge=1, description="Page number (starts from 1)")
    per_page: int = Field(20, ge=1, le=100, description="Items per page (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class Paginator:
    """Utility class for handling pagination logic."""
    
    @staticmethod
    def paginate_query(
        query: Query,
        page: int = 1,
        per_page: int = 20
    ) -> tuple[List, int, int, int, bool, bool]:
        """
        Paginate a SQLAlchemy query.
        
        Args:
            query: SQLAlchemy query object
            page: Page number (1-based)
            per_page: Items per page
            
        Returns:
            Tuple of (items, total, page, per_page, has_next, has_prev)
        """
        # Validate parameters
        page = max(1, page)
        per_page = min(max(1, per_page), 100)  # Limit max per_page to 100
        
        # Get total count
        total = query.count()
        
        # Calculate pagination values
        total_pages = ceil(total / per_page) if total > 0 else 1
        offset = (page - 1) * per_page
        
        # Get items for current page
        items = query.offset(offset).limit(per_page).all()
        
        # Calculate navigation flags
        has_next = page < total_pages
        has_prev = page > 1
        
        return items, total, page, per_page, has_next, has_prev
    
    @staticmethod
    def create_paginated_response(
        items: List[T],
        total: int,
        page: int,
        per_page: int,
        has_next: bool,
        has_prev: bool
    ) -> dict:
        """
        Create a standardized paginated response dictionary.
        
        Args:
            items: List of items for current page
            total: Total number of items
            page: Current page number
            per_page: Items per page
            has_next: Whether there's a next page
            has_prev: Whether there's a previous page
            
        Returns:
            Dictionary with pagination metadata
        """
        total_pages = ceil(total / per_page) if total > 0 else 1
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }


def get_pagination_params(page: int = 1, per_page: int = 20) -> PaginationParams:
    """
    Factory function to create pagination parameters with validation.
    
    Args:
        page: Page number
        per_page: Items per page
        
    Returns:
        Validated PaginationParams object
    """
    return PaginationParams(page=page, per_page=per_page)