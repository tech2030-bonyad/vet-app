// Registration screen with comprehensive form validation
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AuthForm from '../../components/auth/AuthForm';
import { ValidationRules, validatePasswordMatch } from '../../utils/validation';
import { registerUser, clearError } from '../../store/authSlice';
import { RegisterData } from '../../types/auth';
import { RootState, AppDispatch } from '../../store';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

/**
 * Registration screen component
 * Handles new user registration with comprehensive validation
 */
const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Form configuration using React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<RegisterData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    mode: 'onBlur'
  });

  // Watch password field for confirmation validation
  const password = watch('password');

  // Navigate to profile screen when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate('Profile');
    }
  }, [isAuthenticated, navigation]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /**
   * Handle form submission
   * @param data - Registration form data
   */
  const onSubmit = async (data: RegisterData) => {
    // Validate password confirmation
    if (!validatePasswordMatch(data.password, data.confirmPassword)) {
      return;
    }

    try {
      await dispatch(registerUser(data)).unwrap();
      reset();
    } catch (error) {
      // Error is handled by Redux state
      console.error('Registration error:', error);
    }
  };

  /**
   * Navigate to login screen
   */
  const navigateToLogin = () => {
    dispatch(clearError());
    navigation.navigate('Login');
  };

  // Form field configuration
  const formFields = [
    {
      name: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your first name',
      autoCapitalize: 'words' as const,
      autoComplete: 'given-name'
    },
    {
      name: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      autoCapitalize: 'words' as const,
      autoComplete: 'family-name'
    },
    {
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      keyboardType: 'email-address' as const,
      autoCapitalize: 'none' as const,
      autoComplete: 'email'
    },
    {
      name: 'password',
      label: 'Password',
      placeholder: 'Create a password',
      secureTextEntry: true,
      autoComplete: 'new-password'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      placeholder: 'Confirm your password',
      secureTextEntry: true,
      autoComplete: 'new-password'
    }
  ];

  return (
    <AuthForm
      title="Create Account"
      fields={formFields}
      control={control}
      errors={errors}
      onSubmit={handleSubmit(onSubmit)}
      submitButtonText="Create Account"
      isLoading={isLoading}
      error={error}
      children={
        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <Text style={styles.requirementText}>• At least 8 characters long</Text>
          <Text style={styles.requirementText}>• One uppercase letter</Text>
          <Text style={styles.requirementText}>• One lowercase letter</Text>
          <Text style={styles.requirementText}>• One number</Text>
          <Text style={styles.requirementText}>• One special character (@$!%*?&)</Text>
        </View>
      }
      footerContent={
        <View style={styles.footerContainer}>
          <View style={styles.loginContainer}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={navigateToLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  passwordRequirements: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  footerContainer: {
    alignItems: 'center'
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  loginPrompt: {
    color: '#6B7280',
    fontSize: 14
  },
  loginLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default RegisterScreen;