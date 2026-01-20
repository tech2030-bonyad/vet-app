/**
 * Main theme configuration combining colors, typography, spacing, and other design tokens
 * Provides centralized theme management with dark mode support preparation
 */

import { lightThemeColors, darkThemeColors, ThemeColors, colorPalette } from './colors';
import { typography, Typography } from './typography';

export type ThemeMode = 'light' | 'dark';

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
  '6xl': number;
}

export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  full: number;
}

export interface Shadow {
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  xl: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadow: Shadow;
  layout: {
    container: {
      maxWidth: number;
      padding: number;
    };
    screen: {
      padding: number;
      paddingHorizontal: number;
      paddingVertical: number;
    };
  };
  components: {
    button: {
      height: {
        small: number;
        medium: number;
        large: number;
      };
      borderRadius: number;
    };
    input: {
      height: {
        small: number;
        medium: number;
        large: number;
      };
      borderRadius: number;
      borderWidth: number;
    };
    card: {
      borderRadius: number;
      padding: number;
    };
  };
}

// Spacing scale (in pixels)
export const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  '5xl': 96,
  '6xl': 128,
};

// Border radius scale (in pixels)
export const borderRadius: BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadow configurations
export const shadow: Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Light theme configuration
export const lightTheme: Theme = {
  mode: 'light',
  colors: lightThemeColors,
  typography,
  spacing,
  borderRadius,
  shadow,
  layout: {
    container: {
      maxWidth: 1200,
      padding: spacing.md,
    },
    screen: {
      padding: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
    },
  },
  components: {
    button: {
      height: {
        small: 32,
        medium: 44,
        large: 56,
      },
      borderRadius: borderRadius.md,
    },
    input: {
      height: {
        small: 32,
        medium: 44,
        large: 56,
      },
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    card: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
  },
};

// Dark theme configuration (prepared for future implementation)
export const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  colors: darkThemeColors,
};

// Theme context type
export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Helper functions for theme usage
export const getTheme = (mode: ThemeMode = 'light'): Theme => {
  return mode === 'light' ? lightTheme : darkTheme;
};

// Utility function to create responsive spacing
export const createSpacing = (multiplier: number): number => {
  return spacing.md * multiplier;
};

// Utility function to get shadow style based on elevation
export const getShadowStyle = (elevation: 'sm' | 'md' | 'lg' | 'xl') => {
  return shadow[elevation];
};

// Export default theme (light mode)
export default lightTheme;