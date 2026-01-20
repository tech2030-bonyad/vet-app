/**
 * Color palette and theme colors for the application
 * Supports both light and dark themes
 */

export interface ColorPalette {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Secondary colors
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Neutral/Gray colors
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Semantic colors
  success: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  
  warning: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  
  error: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  
  info: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
}

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  
  // Surface colors
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
    disabled: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
    link: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
    success: string;
  };
  
  // Brand colors
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// Base color palette
export const colorPalette: ColorPalette = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
};

// Light theme colors
export const lightThemeColors: ThemeColors = {
  background: {
    primary: '#FFFFFF',
    secondary: colorPalette.neutral[50],
    tertiary: colorPalette.neutral[100],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  surface: {
    primary: '#FFFFFF',
    secondary: colorPalette.neutral[50],
    elevated: '#FFFFFF',
    disabled: colorPalette.neutral[100],
  },
  
  text: {
    primary: colorPalette.neutral[900],
    secondary: colorPalette.neutral[600],
    tertiary: colorPalette.neutral[500],
    disabled: colorPalette.neutral[400],
    inverse: '#FFFFFF',
    link: colorPalette.primary[600],
  },
  
  border: {
    primary: colorPalette.neutral[200],
    secondary: colorPalette.neutral[300],
    focus: colorPalette.primary[500],
    error: colorPalette.error[500],
    success: colorPalette.success[500],
  },
  
  brand: {
    primary: colorPalette.primary[500],
    secondary: colorPalette.secondary[500],
    accent: colorPalette.primary[600],
  },
  
  semantic: {
    success: colorPalette.success[500],
    warning: colorPalette.warning[500],
    error: colorPalette.error[500],
    info: colorPalette.info[500],
  },
};

// Dark theme colors (prepared for future implementation)
export const darkThemeColors: ThemeColors = {
  background: {
    primary: colorPalette.neutral[900],
    secondary: colorPalette.neutral[800],
    tertiary: colorPalette.neutral[700],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  surface: {
    primary: colorPalette.neutral[800],
    secondary: colorPalette.neutral[700],
    elevated: colorPalette.neutral[700],
    disabled: colorPalette.neutral[800],
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: colorPalette.neutral[300],
    tertiary: colorPalette.neutral[400],
    disabled: colorPalette.neutral[500],
    inverse: colorPalette.neutral[900],
    link: colorPalette.primary[400],
  },
  
  border: {
    primary: colorPalette.neutral[700],
    secondary: colorPalette.neutral[600],
    focus: colorPalette.primary[400],
    error: colorPalette.error[400],
    success: colorPalette.success[400],
  },
  
  brand: {
    primary: colorPalette.primary[400],
    secondary: colorPalette.secondary[400],
    accent: colorPalette.primary[300],
  },
  
  semantic: {
    success: colorPalette.success[400],
    warning: colorPalette.warning[400],
    error: colorPalette.error[400],
    info: colorPalette.info[400],
  },
};