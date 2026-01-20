import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

interface ErrorMessageProps {
  /** Error object or error message string */
  error?: Error | string | null;
  /** Error type for styling and icon selection */
  type?: ErrorType;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Retry button callback */
  onRetry?: () => void;
  /** Whether to show dismiss button */
  showDismiss?: boolean;
  /** Dismiss button callback */
  onDismiss?: () => void;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Custom error message override */
  customMessage?: string;
}

/**
 * Reusable Error Message Component
 * Displays user-friendly error messages with optional retry functionality
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  type = 'general',
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  containerStyle,
  textStyle,
  customMessage,
}) => {
  if (!error && !customMessage) {
    return null;
  }

  const errorMessage = customMessage || errorHandler.getErrorMessage(error, type);
  const errorIcon = getErrorIcon(type);

  return (
    <View style={[styles.container, getContainerStyle(type), containerStyle]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{errorIcon}</Text>
        <Text style={[styles.message, getTextStyle(type), textStyle]}>
          {errorMessage}
        </Text>
      </View>
      
      <View style={styles.actions}>
        {showRetry && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {showDismiss && onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Inline Error Component for form fields
 */
export const InlineError: React.FC<{
  error?: string | null;
  visible?: boolean;
}> = ({ error, visible = true }) => {
  if (!error || !visible) {
    return null;
  }

  return (
    <View style={styles.inlineContainer}>
      <Text style={styles.inlineError}>⚠️ {error}</Text>
    </View>
  );
};

/**
 * Network Error Component with specific messaging
 */
export const NetworkError: React.FC<{
  onRetry?: () => void;
  isOffline?: boolean;
}> = ({ onRetry, isOffline = false }) => {
  const message = isOffline
    ? 'You appear to be offline. Please check your internet connection.'
    : 'Network error occurred. Please check your connection and try again.';

  return (
    <ErrorMessage
      customMessage={message}
      type="network"
      showRetry={!!onRetry}
      onRetry={onRetry}
    />
  );
};

/**
 * Empty State Error Component
 */
export const EmptyStateError: React.FC<{
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({
  title = 'No data found',
  message = 'There seems to be no data available at the moment.',
  actionText = 'Refresh',
  onAction,
}) => (
  <View style={styles.emptyStateContainer}>
    <Text style={styles.emptyStateIcon}>📭</Text>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateMessage}>{message}</Text>
    {onAction && (
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAction}>
        <Text style={styles.emptyStateButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/**
 * Get error icon based on error type
 */
const getErrorIcon = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return '🌐';
    case 'validation':
      return '⚠️';
    case 'authentication':
      return '🔒';
    case 'permission':
      return '🚫';
    case 'server':
      return '🔧';
    default:
      return '❌';
  }
};

/**
 * Get container style based on error type
 */
const getContainerStyle = (type: ErrorType): ViewStyle => {
  const baseStyle = styles.typeContainer;
  
  switch (type) {
    case 'network':
      return { ...baseStyle, backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' };
    case 'validation':
      return { ...baseStyle, backgroundColor: '#F8D7DA', borderColor: '#F5C6CB' };
    case 'authentication':
      return { ...baseStyle, backgroundColor: '#D1ECF1', borderColor: '#BEE5EB' };
    case 'permission':
      return { ...baseStyle, backgroundColor: '#F8D7DA', borderColor: '#F5C6CB' };
    case 'server':
      return { ...baseStyle, backgroundColor: '#F8D7DA', borderColor: '#F5C6CB' };
    default:
      return { ...baseStyle, backgroundColor: '#F8F9FA', borderColor: '#DEE2E6' };
  }
};

/**
 * Get text style based on error type
 */
const getTextStyle = (type: ErrorType): TextStyle => {
  switch (type) {
    case 'network':
      return { color: '#856404' };
    case 'validation':
      return { color: '#721C24' };
    case 'authentication':
      return { color: '#0C5460' };
    case 'permission':
      return { color: '#721C24' };
    case 'server':
      return { color: '#721C24' };
    default:
      return { color: '#495057' };
  }
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeContainer: {
    borderWidth: 1,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  inlineContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  inlineError: {
    fontSize: 14,
    color: '#DC3545',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});