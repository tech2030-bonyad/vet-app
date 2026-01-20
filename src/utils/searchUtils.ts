import { SearchFilters, SearchResult, SortOption } from '../types/search';

/**
 * Debounce function to limit API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Highlight search terms in text
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Filter results based on search filters
 */
export const filterResults = (results: SearchResult[], filters: SearchFilters): SearchResult[] => {
  return results.filter(result => {
    // Category filter
    if (filters.category && result.type !== filters.category) {
      return false;
    }
    
    // Price range filter
    if (filters.priceRange && result.price !== undefined) {
      const { min, max } = filters.priceRange;
      if (result.price < min || result.price > max) {
        return false;
      }
    }
    
    // Rating filter
    if (filters.rating && result.rating !== undefined) {
      if (result.rating < filters.rating) {
        return false;
      }
    }
    
    // Distance filter
    if (filters.distance && result.distance !== undefined) {
      if (result.distance > filters.distance) {
        return false;
      }
    }
    
    // Availability filter
    if (filters.availability !== undefined && result.availability !== filters.availability) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sort results based on sort option
 */
export const sortResults = (results: SearchResult[], sortBy: SortOption): SearchResult[] => {
  return [...results].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy.key) {
      case 'price':
        comparison = (a.price || 0) - (b.price || 0);
        break;
      case 'rating':
        comparison = (b.rating || 0) - (a.rating || 0);
        break;
      case 'distance':
        comparison = (a.distance || 0) - (b.distance || 0);
        break;
      case 'name':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'relevance':
      default:
        return 0;
    }
    
    return sortBy.direction === 'desc' ? -comparison : comparison;
  });
};

/**
 * Generate search suggestions based on query
 */
export const generateSearchSuggestions = (
  query: string,
  recentSearches: string[],
  popularSearches: string[]
): string[] => {
  const suggestions = new Set<string>();
  
  // Add recent searches that match
  recentSearches
    .filter(search => search.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3)
    .forEach(search => suggestions.add(search));
  
  // Add popular searches that match
  popularSearches
    .filter(search => search.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .forEach(search => suggestions.add(search));
  
  return Array.from(suggestions).slice(0, 8);
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Format price for display
 */
export const formatPrice = (price: number, currency: string = '$'): string => {
  return `${currency}${price.toLocaleString()}`;
};

/**
 * Format distance for display
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
};

/**
 * Validate search filters
 */
export const validateFilters = (filters: SearchFilters): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate price range
  if (filters.priceRange) {
    const { min, max } = filters.priceRange;
    if (min < 0) {
      errors.push('Minimum price cannot be negative');
    }
    if (max < min) {
      errors.push('Maximum price must be greater than minimum price');
    }
  }
  
  // Validate rating
  if (filters.rating !== undefined && (filters.rating < 0 || filters.rating > 5)) {
    errors.push('Rating must be between 0 and 5');
  }
  
  // Validate distance
  if (filters.distance !== undefined && filters.distance < 0) {
    errors.push('Distance cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Build search query string for API
 */
export const buildSearchQuery = (query: string, filters: SearchFilters): Record<string, any> => {
  const params: Record<string, any> = {};
  
  if (query.trim()) {
    params.q = query.trim();
  }
  
  if (filters.category) {
    params.category = filters.category;
  }
  
  if (filters.priceRange) {
    params.minPrice = filters.priceRange.min;
    params.maxPrice = filters.priceRange.max;
  }
  
  if (filters.rating) {
    params.minRating = filters.rating;
  }
  
  if (filters.distance) {
    params.maxDistance = filters.distance;
  }
  
  if (filters.location) {
    params.lat = filters.location.latitude;
    params.lng = filters.location.longitude;
  }
  
  if (filters.availability !== undefined) {
    params.available = filters.availability;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    params.tags = filters.tags.join(',');
  }
  
  return params;
};