export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  distance?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  availability?: boolean;
  tags?: string[];
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'clinic' | 'category' | 'recent';
  count?: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
  notifications: boolean;
}

export interface SearchResult {
  id: string;
  type: 'product' | 'clinic';
  title: string;
  subtitle?: string;
  image?: string;
  rating?: number;
  price?: number;
  distance?: number;
  location?: string;
  availability?: boolean;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  history: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  isLoading: boolean;
  error: string | null;
  sortBy: SortOption;
}