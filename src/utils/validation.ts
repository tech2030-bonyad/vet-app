// Validation utilities for form fields
export const ValidationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Please enter a valid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters long'
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  firstName: {
    required: 'First name is required',
    minLength: {
      value: 2,
      message: 'First name must be at least 2 characters long'
    },
    maxLength: {
      value: 50,
      message: 'First name cannot exceed 50 characters'
    }
  },
  lastName: {
    required: 'Last name is required',
    minLength: {
      value: 2,
      message: 'Last name must be at least 2 characters long'
    },
    maxLength: {
      value: 50,
      message: 'Last name cannot exceed 50 characters'
    }
  }
};

/**
 * Validates if passwords match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Validates email format
 * @param email - Email to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with validation result and strength level
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  if (password.length < 8) {
    return { isValid: false, strength: 'weak', message: 'Password too short' };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (criteriaCount < 3) {
    return { isValid: false, strength: 'weak', message: 'Password needs more complexity' };
  } else if (criteriaCount === 3) {
    return { isValid: true, strength: 'medium', message: 'Good password strength' };
  } else {
    return { isValid: true, strength: 'strong', message: 'Strong password' };
  }
};