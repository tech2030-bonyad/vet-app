import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSearch } from '../../hooks/useSearch';
import { SearchSuggestions } from './SearchSuggestions';
import { AdvancedFilters } from './AdvancedFilters';
import { colors, typography, spacing } from '../../theme';

interface GlobalSearchProps {
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = 'Search products and clinics...',
  onFocus,
  onBlur,
  showFilters = true,
  autoFocus = false,
}) => {
  const {
    query,
    suggestions,
    isLoading,
    updateQuery,
    search,
    filters,
  } = useSearch();

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
    onFocus?.();
    
    // Animate search bar expansion
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, onFocus]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setShowSuggestions(false);
    onBlur?.();
    
    // Animate search bar contraction
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, onBlur]);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    updateQuery(text);
    setShowSuggestions(text.length > 0);
  }, [updateQuery]);

  // Handle search submission
  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      search();
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  }, [query, search]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    updateQuery(suggestion);
    search(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  }, [updateQuery, search]);

  // Handle clear search
  const handleClear = useCallback(() => {
    updateQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [updateQuery]);

  // Toggle advanced filters
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(!showAdvancedFilters);
  }, [showAdvancedFilters]);

  // Calculate active filters count
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof typeof filters];
    return value !== undefined && value !== null && value !== '';
  }).length;

  const searchBarWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '100%'],
  });

  const filterButtonOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  return (
    <View style={styles.container}>
      {/* Search Input Container */}
      <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
        <View style={[styles.searchInputContainer, isFocused && styles.searchInputFocused]}>
          {/* Search Icon */}
          <Icon
            name="search"
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.searchIcon}
          />
          
          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={autoFocus}
            autoCorrect={false}
            autoCapitalize="none"
          />
          
          {/* Loading Indicator or Clear Button */}
          {isLoading ? (
            <Icon
              name="refresh"
              size={20}
              color={colors.primary}
              style={[styles.actionIcon, styles.loadingIcon]}
            />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Icon
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Filter Button */}
        {showFilters && (
          <Animated.View style={{ opacity: filterButtonOpacity }}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFiltersCount > 0 && styles.filterButtonActive,
              ]}
              onPress={toggleAdvancedFilters}
            >
              <Icon
                name="options"
                size={20}
                color={activeFiltersCount > 0 ? colors.white : colors.textSecondary}
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Icon name="ellipse" size={8} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
      
      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <SearchSuggestions
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
          query={query}
        />
      )}
      
      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <AdvancedFilters
          visible={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    marginRight: spacing.sm,
  },
  searchInputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    color: colors.text,
    paddingVertical: 0, // Remove default padding on Android
  },
  actionIcon: {
    marginLeft: spacing.sm,
  },
  loadingIcon: {
    // Add rotation animation if needed
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});