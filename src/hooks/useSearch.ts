import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  performSearch,
  fetchSuggestions,
  saveSearch,
  setQuery,
  setFilters,
  updateFilter,
  clearFilters,
  setSortBy,
  addToHistory,
  removeFromHistory,
  clearHistory,
  removeSavedSearch,
} from '../store/searchSlice';
import { SearchFilters, SortOption, SavedSearch, SearchHistoryItem } from '../types/search';
import { debounce } from '../utils/searchUtils';
import { generateId } from '../utils/helpers';

export const useSearch = () => {
  const dispatch = useDispatch();
  const searchState = useSelector((state: RootState) => state.search);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string, filters: SearchFilters) => {
      if (query.trim() || Object.keys(filters).length > 0) {
        dispatch(performSearch({ query, filters }));
        
        // Add to search history
        const historyItem: SearchHistoryItem = {
          id: generateId(),
          query,
          filters,
          timestamp: new Date(),
        };
        dispatch(addToHistory(historyItem));
      }
    }, 300),
    [dispatch]
  );

  // Debounced suggestions fetch
  const debouncedFetchSuggestions = useMemo(
    () => debounce((query: string) => {
      if (query.trim().length > 1) {
        dispatch(fetchSuggestions(query));
      }
    }, 200),
    [dispatch]
  );

  // Search function
  const search = useCallback((query?: string, filters?: SearchFilters) => {
    const searchQuery = query ?? searchState.query;
    const searchFilters = filters ?? searchState.filters;
    
    if (query !== undefined) {
      dispatch(setQuery(query));
    }
    if (filters !== undefined) {
      dispatch(setFilters(filters));
    }
    
    debouncedSearch(searchQuery, searchFilters);
  }, [dispatch, searchState.query, searchState.filters, debouncedSearch]);

  // Update query and fetch suggestions
  const updateQuery = useCallback((query: string) => {
    dispatch(setQuery(query));
    debouncedFetchSuggestions(query);
  }, [dispatch, debouncedFetchSuggestions]);

  // Update specific filter
  const updateSearchFilter = useCallback((key: keyof SearchFilters, value: any) => {
    dispatch(updateFilter({ key, value }));
    // Trigger search with updated filters
    const updatedFilters = { ...searchState.filters, [key]: value };
    debouncedSearch(searchState.query, updatedFilters);
  }, [dispatch, searchState.query, searchState.filters, debouncedSearch]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
    debouncedSearch(searchState.query, {});
  }, [dispatch, searchState.query, debouncedSearch]);

  // Update sort option
  const updateSortBy = useCallback((sortOption: SortOption) => {
    dispatch(setSortBy(sortOption));
    // Re-trigger search with new sort
    debouncedSearch(searchState.query, searchState.filters);
  }, [dispatch, searchState.query, searchState.filters, debouncedSearch]);

  // Save current search
  const saveCurrentSearch = useCallback(async (name: string, notifications: boolean = false) => {
    const savedSearchData = {
      name,
      query: searchState.query,
      filters: searchState.filters,
      notifications,
    };
    
    try {
      await dispatch(saveSearch(savedSearchData)).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to save search:', error);
      return false;
    }
  }, [dispatch, searchState.query, searchState.filters]);

  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    dispatch(setQuery(savedSearch.query));
    dispatch(setFilters(savedSearch.filters));
    debouncedSearch(savedSearch.query, savedSearch.filters);
  }, [dispatch, debouncedSearch]);

  // Remove from history
  const removeHistoryItem = useCallback((id: string) => {
    dispatch(removeFromHistory(id));
  }, [dispatch]);

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    dispatch(clearHistory());
  }, [dispatch]);

  // Remove saved search
  const deleteSavedSearch = useCallback((id: string) => {
    dispatch(removeSavedSearch(id));
  }, [dispatch]);

  // Get filtered and sorted results
  const sortedResults = useMemo(() => {
    const { results, sortBy } = searchState;
    
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
        default:
          return 0;
      }
      
      return sortBy.direction === 'desc' ? -comparison : comparison;
    });
  }, [searchState.results, searchState.sortBy]);

  return {
    // State
    ...searchState,
    sortedResults,
    
    // Actions
    search,
    updateQuery,
    updateSearchFilter,
    clearAllFilters,
    updateSortBy,
    saveCurrentSearch,
    loadSavedSearch,
    removeHistoryItem,
    clearSearchHistory,
    deleteSavedSearch,
  };
};