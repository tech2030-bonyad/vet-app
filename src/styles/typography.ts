/**
 * Typography system with font scales, weights, and line heights
 * Provides consistent text styling across the application
 */

import { TextStyle } from 'react-native';

export interface FontWeight {
  light: '300';
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
  extrabold: '800';
}

export interface FontSize {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
  '6xl': number;
}

export interface LineHeight {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
  '6xl': number;
}

export interface LetterSpacing {
  tight: number;
  normal: number;
  wide: number;
}

export interface TypographyVariant extends TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing?: number;
}

export interface Typography {
  // Display text styles
  display: {
    large: TypographyVariant;
    medium: TypographyVariant;
    small: TypographyVariant;
  };
  
  // Heading text styles
  heading: {
    h1: TypographyVariant;
    h2: TypographyVariant;
    h3: TypographyVariant;
    h4: TypographyVariant;
    h5: TypographyVariant;
    h6: TypographyVariant;
  };
  
  // Body text styles
  body: {
    large: TypographyVariant;
    medium: TypographyVariant;
    small: TypographyVariant;
  };
  
  // Label text styles
  label: {
    large: TypographyVariant;
    medium: TypographyVariant;
    small: TypographyVariant;
  };
  
  // Caption text styles
  caption: {
    large: TypographyVariant;
    medium: TypographyVariant;
    small: TypographyVariant;
  };
  
  // Button text styles
  button: {
    large: TypographyVariant;
    medium: TypographyVariant;
    small: TypographyVariant;
  };
}

// Font configuration
export const fontFamily = {
  primary: 'System', // Use system font as default
  secondary: 'System',
  mono: 'Courier New',
};

// Font weights
export const fontWeight: FontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// Font sizes (in pixels)
export const fontSize: FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

// Line heights (in pixels)
export const lineHeight: LineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
};

// Letter spacing
export const letterSpacing: LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
};

// Typography system
export const typography: Typography = {
  display: {
    large: {
      fontSize: fontSize['6xl'],
      lineHeight: lineHeight['6xl'],
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
      fontFamily: fontFamily.primary,
    },
    medium: {
      fontSize: fontSize['5xl'],
      lineHeight: lineHeight['5xl'],
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
      fontFamily: fontFamily.primary,
    },
    small: {
      fontSize: fontSize['4xl'],
      lineHeight: lineHeight['4xl'],
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
  },
  
  heading: {
    h1: {
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight['3xl'],
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
      fontFamily: fontFamily.primary,
    },
    h2: {
      fontSize: fontSize['2xl'],
      lineHeight: lineHeight['2xl'],
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
      fontFamily: fontFamily.primary,
    },
    h3: {
      fontSize: fontSize.xl,
      lineHeight: lineHeight.xl,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    h4: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.lg,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    h5: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    h6: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
  },
  
  body: {
    large: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.lg,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    medium: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    small: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
  },
  
  label: {
    large: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    medium: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    small: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.xs,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.wide,
      fontFamily: fontFamily.primary,
    },
  },
  
  caption: {
    large: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    medium: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.xs,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    small: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.wide,
      fontFamily: fontFamily.primary,
    },
  },
  
  button: {
    large: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    medium: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
      fontFamily: fontFamily.primary,
    },
    small: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.xs,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.wide,
      fontFamily: fontFamily.primary,
    },
  },
};

// Helper function to get typography variant
export const getTypographyVariant = (
  category: keyof Typography,
  variant: string
): TypographyVariant => {
  try {
    return (typography[category] as any)[variant] || typography.body.medium;
  } catch (error) {
    console.warn(`Typography variant not found: ${category}.${variant}`);
    return typography.body.medium;
  }
};