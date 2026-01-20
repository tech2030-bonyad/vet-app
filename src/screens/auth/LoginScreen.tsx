// Login screen with form validation and error handling
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AuthForm from '../../components/auth/AuthForm';
import { ValidationRules } from '../../utils/validation';
import { loginUser, clearError } from '../../store/authSlice';
import { LoginCredentials } from '../../types/auth';
import { RootState, AppDispatch } from '../../store';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

/**
 * Login screen component
 * Handles user authentication with email and password
 */
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Form configuration using React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onBlur'
  });

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
   * @param data - Login form data
   */
  const onSubmit = async (data: LoginCredentials) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      reset();
    } catch (error) {
      // Error is handled by Redux state
      console.error('Login error:', error);
    }
  };

  /**
   * Navigate to registration screen
   */
  const navigateToRegister = () => {
    dispatch(clearError());
    navigation.navigate('Register');
  };

  /**
   * Navigate to forgot password screen
   */
  const navigateToForgotPassword = () => {
    dispatch(clearError());
    navigation.navigate('ForgotPassword');
  };

  // Form field configuration
  const formFields = [
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
      placeholder: 'Enter your password',
      secureTextEntry: true,
      autoComplete: 'password'
    }
  ];

  return (
    <AuthForm
      title="Welcome Back"
      fields={formFields}
      control={control}
      errors={errors}
      onSubmit={handleSubmit(onSubmit)}
      submitButtonText="Sign In"
      isLoading={isLoading}
      error={error}
      footerContent={
        <View style={styles.footerContainer}>
          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={navigateToForgotPassword}
            style={styles.linkButton}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={navigateToRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: 'center',
    gap: 16
  },
  linkButton: {
    paddingVertical: 8
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500'
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  registerPrompt: {
    color: '#6B7280',
    fontSize: 14
  },
  registerLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default LoginScreen;