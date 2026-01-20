// Reusable authentication form component with validation
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';

interface FormField {
  name: string;
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
}

interface AuthFormProps {
  title: string;
  fields: FormField[];
  control: Control<any>;
  errors: FieldErrors<any>;
  onSubmit: () => void;
  submitButtonText: string;
  isLoading: boolean;
  error?: string | null;
  children?: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * Reusable authentication form component
 * Provides consistent styling and behavior across auth screens
 */
const AuthForm: React.FC<AuthFormProps> = ({
  title,
  fields,
  control,
  errors,
  onSubmit,
  submitButtonText,
  isLoading,
  error,
  children,
  footerContent
}) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.fieldsContainer}>
            {fields.map((field) => (
              <View key={field.name} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors[field.name] && styles.inputError
                      ]}
                      placeholder={field.placeholder}
                      placeholderTextColor="#999"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={field.secureTextEntry}
                      keyboardType={field.keyboardType || 'default'}
                      autoCapitalize={field.autoCapitalize || 'none'}
                      autoComplete={field.autoComplete}
                      editable={!isLoading}
                    />
                  )}
                />
                {errors[field.name] && (
                  <Text style={styles.fieldError}>
                    {errors[field.name]?.message as string}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Additional Content */}
          {children && <View style={styles.additionalContent}>{children}</View>}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{submitButtonText}</Text>
            )}
          </TouchableOpacity>

          {/* Footer Content */}
          {footerContent && (
            <View style={styles.footerContent}>{footerContent}</View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center'
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center'
  },
  fieldsContainer: {
    marginBottom: 24
  },
  fieldContainer: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A'
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2'
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4
  },
  additionalContent: {
    marginBottom: 24
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  footerContent: {
    marginTop: 24,
    alignItems: 'center'
  }
});

export default AuthForm;