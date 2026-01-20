export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  images: string[];
  category: ProductCategory;
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  tags: string[];
  specifications?: Record<string, string>;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface ProductFilters {
  search: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  nextPage?: number;
}