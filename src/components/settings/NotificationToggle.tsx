import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NotificationToggleProps } from '../../types/notification';

/**
 * Reusable notification toggle component
 * Provides a consistent interface for notification settings
 */
const NotificationToggle: React.FC<NotificationToggleProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  testID,
}) => {
  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, disabled && styles.disabledText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: '#E5E5E5',
          true: '#007AFF',
        }}
        thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
        ios_backgroundColor="#E5E5E5"
        testID={`${testID}-switch`}
      />
    </TouchableOpacity>
  );
};

/**
 * Section component for grouping related notification settings
 */
export const NotificationSection: React.FC<{
  title: string;
  children: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}> = ({ title, children, enabled, onToggle }) => {
  return (
    <View style={styles.sectionContainer}>
      <NotificationToggle
        title={title}
        value={enabled}
        onValueChange={onToggle}
        testID={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {enabled && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    minHeight: 60,
  },
  disabled: {
    opacity: 0.5,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  disabledText: {
    color: '#999999',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionContent: {
    paddingLeft: 20,
    backgroundColor: '#F8F9FA',
  },
});

export default NotificationToggle;