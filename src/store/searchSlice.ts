import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SearchState, SearchFilters, SearchResult, SearchSuggestion, SearchHistoryItem, SavedSearch, SortOption } from '../types/search';
import { searchAPI } from '../services/searchAPI';

// Async thunks for API calls
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async ({ query, filters }: { query: string; filters: SearchFilters }) => {
    const response = await searchAPI.search(query, filters);
    return response.data;
  }
);

export const fetchSuggestions = createAsyncThunk(
  'search/fetchSuggestions',
  async (query: string) => {
    const response = await searchAPI.getSuggestions(query);
    return response.data;
  }
);

export const saveSearch = createAsyncThunk(
  'search/saveSearch',
  async (savedSearch: Omit<SavedSearch, 'id' | 'createdAt'>) => {
    const response = await searchAPI.saveSearch(savedSearch);
    return response.data;
  }
);

const initialState: SearchState = {
  query: '',
  filters: {},
  results: [],
  suggestions: [],
  history: [],
  savedSearches: [],
  isLoading: false,
  error: null,
  sortBy: { key: 'relevance', label: 'Relevance', direction: 'desc' },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: keyof SearchFilters; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSortBy: (state, action: PayloadAction<SortOption>) => {
      state.sortBy = action.payload;
    },
    addToHistory: (state, action: PayloadAction<SearchHistoryItem>) => {
      // Remove duplicate if exists
      state.history = state.history.filter(item => item.query !== action.payload.query);
      // Add to beginning and limit to 20 items
      state.history.unshift(action.payload);
      state.history = state.history.slice(0, 20);
    },
    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },
    clearHistory: (state) => {
      state.history = [];
    },
    removeSavedSearch: (state, action: PayloadAction<string>) => {
      state.savedSearches = state.savedSearches.filter(search => search.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Perform search
      .addCase(performSearch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Search failed';
      })
      // Fetch suggestions
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      })
      // Save search
      .addCase(saveSearch.fulfilled, (state, action) => {
        state.savedSearches.push(action.payload);
      });
  },
});

export const {
  setQuery,
  setFilters,
  updateFilter,
  clearFilters,
  setSortBy,
  addToHistory,
  removeFromHistory,
  clearHistory,
  removeSavedSearch,
  clearError,
} = searchSlice.actions;

export default searchSlice.reducer;