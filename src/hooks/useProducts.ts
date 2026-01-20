import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, ProductCategory, ProductFilters, ProductListResponse } from '../types/product';
import { productService } from '../services/productService';

interface UseProductsReturn {
  products: Product[];
  categories: ProductCategory[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  loadMore: () => void;
  refresh: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing product data, filtering, and pagination
 */
export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFiltersState] = useState<ProductFilters>({
    search: '',
    sortBy: 'newest',
    sortOrder: 'desc',
  });
  
  const currentPage = useRef(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  /**
   * Load products with current filters
   */
  const loadProducts = useCallback(async (
    page: number = 1,
    isRefresh: boolean = false,
    currentFilters: ProductFilters = filters
  ) => {
    try {
      if (page === 1) {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const response: ProductListResponse = await productService.getProducts(
        currentFilters,
        page,
        20
      );
      
      if (page === 1) {
        setProducts(response.products);
      } else {
        setProducts(prev => [...prev, ...response.products]);
      }
      
      setHasMore(response.hasMore);
      currentPage.current = page;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters]);
  
  /**
   * Load categories
   */
  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);
  
  /**
   * Set filters with debounced search
   */
  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search queries
    if (newFilters.search !== filters.search) {
      searchTimeoutRef.current = setTimeout(() => {
        currentPage.current = 1;
        loadProducts(1, false, newFilters);
      }, 500);
    } else {
      // Apply other filters immediately
      currentPage.current = 1;
      loadProducts(1, false, newFilters);
    }
  }, [filters.search, loadProducts]);
  
  /**
   * Load more products (infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage.current + 1;
      loadProducts(nextPage);
    }
  }, [loadingMore, hasMore, loading, loadProducts]);
  
  /**
   * Refresh products
   */
  const refresh = useCallback(() => {
    currentPage.current = 1;
    loadProducts(1, true);
  }, [loadProducts]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Initial load
  useEffect(() => {
    loadProducts();
    loadCategories();
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    products,
    categories,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    filters,
    setFilters,
    loadMore,
    refresh,
    clearError,
  };
};