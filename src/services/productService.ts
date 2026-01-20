import { Product, ProductCategory, ProductFilters, ProductListResponse } from '../types/product';

// Mock API service - replace with actual API calls
class ProductService {
  private baseUrl = 'https://api.petstore.com'; // Replace with actual API URL
  
  /**
   * Fetch products with filters and pagination
   */
  async getProducts(
    filters: ProductFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductListResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - replace with actual API call
      const mockProducts: Product[] = this.generateMockProducts();
      
      // Apply filters
      let filteredProducts = mockProducts;
      
      if (filters.search) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.categoryId) {
        filteredProducts = filteredProducts.filter(product =>
          product.category.id === filters.categoryId
        );
      }
      
      if (filters.inStock) {
        filteredProducts = filteredProducts.filter(product => product.inStock);
      }
      
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice!);
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          let comparison = 0;
          
          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            case 'rating':
              comparison = a.rating - b.rating;
              break;
            case 'newest':
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
          }
          
          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });
      }
      
      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      return {
        products: paginatedProducts,
        totalCount: filteredProducts.length,
        hasMore: endIndex < filteredProducts.length,
        nextPage: endIndex < filteredProducts.length ? page + 1 : undefined,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }
  
  /**
   * Fetch product categories
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      // Mock data - replace with actual API call
      return [
        { id: '1', name: 'Dog Food', slug: 'dog-food', icon: '🐕' },
        { id: '2', name: 'Cat Food', slug: 'cat-food', icon: '🐱' },
        { id: '3', name: 'Treats', slug: 'treats', icon: '🦴' },
        { id: '4', name: 'Toys', slug: 'toys', icon: '🎾' },
        { id: '5', name: 'Accessories', slug: 'accessories', icon: '🎀' },
      ];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }
  
  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      // Mock data - replace with actual API call
      const products = this.generateMockProducts();
      const product = products.find(p => p.id === id);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }
  
  /**
   * Generate mock products for demonstration
   */
  private generateMockProducts(): Product[] {
    const categories = [
      { id: '1', name: 'Dog Food', slug: 'dog-food', icon: '🐕' },
      { id: '2', name: 'Cat Food', slug: 'cat-food', icon: '🐱' },
      { id: '3', name: 'Treats', slug: 'treats', icon: '🦴' },
      { id: '4', name: 'Toys', slug: 'toys', icon: '🎾' },
    ];
    
    const products: Product[] = [];
    
    for (let i = 1; i <= 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      products.push({
        id: i.toString(),
        name: `Premium ${category.name} Product ${i}`,
        description: `High-quality ${category.name.toLowerCase()} made with natural ingredients. Perfect for your beloved pet's health and happiness.`,
        price: Math.floor(Math.random() * 100) + 10,
        originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 120) + 15 : undefined,
        imageUrl: `https://picsum.photos/300/300?random=${i}`,
        images: [
          `https://picsum.photos/300/300?random=${i}`,
          `https://picsum.photos/300/300?random=${i + 100}`,
          `https://picsum.photos/300/300?random=${i + 200}`,
        ],
        category,
        brand: ['PetCare', 'HealthyPaws', 'NaturalChoice', 'PremiumPet'][Math.floor(Math.random() * 4)],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 500) + 10,
        inStock: Math.random() > 0.1,
        tags: ['premium', 'natural', 'healthy'].slice(0, Math.floor(Math.random() * 3) + 1),
        specifications: {
          'Weight': `${Math.floor(Math.random() * 10) + 1} lbs`,
          'Age Range': ['Puppy', 'Adult', 'Senior', 'All Ages'][Math.floor(Math.random() * 4)],
          'Ingredients': 'Natural, Organic',
        },
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    }
    
    return products;
  }
}

export const productService = new ProductService();