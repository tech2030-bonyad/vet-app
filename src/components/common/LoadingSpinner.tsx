import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface LoadingSpinnerProps {
  /** Whether the loading spinner is visible */
  visible?: boolean;
  /** Loading message to display */
  message?: string;
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Color of the spinner */
  color?: string;
  /** Whether to show as overlay modal */
  overlay?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Whether the modal can be dismissed by tapping outside */
  dismissible?: boolean;
}

/**
 * Reusable Loading Spinner Component
 * Can be used as inline component or overlay modal
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible = true,
  message,
  size = 'large',
  color = '#007AFF',
  overlay = false,
  containerStyle,
  textStyle,
  dismissible = false,
}) => {
  const renderSpinner = () => (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && (
          <Text style={[styles.message, textStyle]}>{message}</Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={dismissible ? undefined : () => {}}
      >
        <View style={styles.overlay}>
          {renderSpinner()}
        </View>
      </Modal>
    );
  }

  return visible ? renderSpinner() : null;
};

/**
 * Inline Loading Spinner for smaller components
 */
export const InlineLoader: React.FC<{
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}> = ({ size = 'small', color = '#007AFF', message }) => (
  <View style={styles.inlineContainer}>
    <ActivityIndicator size={size} color={color} />
    {message && <Text style={styles.inlineMessage}>{message}</Text>}
  </View>
);

/**
 * Full Screen Loading Component
 */
export const FullScreenLoader: React.FC<{
  message?: string;
  visible?: boolean;
}> = ({ message = 'Loading...', visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.fullScreenContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.fullScreenMessage}>{message}</Text>
    </View>
  );
};

/**
 * Button Loading State Component
 */
export const ButtonLoader: React.FC<{
  loading: boolean;
  size?: 'small' | 'large';
  color?: string;
}> = ({ loading, size = 'small', color = 'white' }) => {
  if (!loading) return null;

  return (
    <ActivityIndicator
      size={size}
      color={color}
      style={styles.buttonLoader}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  fullScreenMessage: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  buttonLoader: {
    marginHorizontal: 8,
  },
});