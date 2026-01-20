import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import NotificationToggle, { NotificationSection } from '../../components/settings/NotificationToggle';
import { NotificationSettings, NotificationFrequency } from '../../types/notification';
import { notificationService } from '../../services/notificationService';

// Redux types (adjust based on your store structure)
interface RootState {
  user: {
    id: string;
    isAuthenticated: boolean;
  };
  notifications: {
    settings: NotificationSettings | null;
    loading: boolean;
    error: string | null;
  };
}

/**
 * Notification Settings Screen Component
 * Allows users to manage their notification preferences across different channels
 */
const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.user);
  const { settings, loading, error } = useSelector((state: RootState) => state.notifications);

  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form management
  const { control, handleSubmit, watch, setValue, reset } = useForm<NotificationSettings>({
    defaultValues: settings || notificationService.getDefaultSettings(user.id),
  });

  const watchedValues = watch();

  /**
   * Load notification settings on component mount
   */
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  /**
   * Reset form when settings change from Redux
   */
  useEffect(() => {
    if (settings) {
      reset(settings);
      setHasUnsavedChanges(false);
    }
  }, [settings, reset]);

  /**
   * Track form changes
   */
  useEffect(() => {
    if (settings) {
      const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(settings);
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues, settings]);

  /**
   * Load notification settings from API
   */
  const loadNotificationSettings = useCallback(async () => {
    try {
      const response = await notificationService.getNotificationSettings(user.id);
      
      if (response.success && response.data) {
        // Dispatch to Redux store
        dispatch({
          type: 'notifications/setSettings',
          payload: response.data,
        });
      } else {
        throw new Error(response.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert(
        'Error',
        'Failed to load notification settings. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [user.id, dispatch]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotificationSettings();
    setIsRefreshing(false);
  }, [loadNotificationSettings]);

  /**
   * Save notification settings
   */
  const onSubmit = useCallback(async (formData: NotificationSettings) => {
    setIsSaving(true);
    
    try {
      const response = await notificationService.updateNotificationSettings(
        user.id,
        formData
      );
      
      if (response.success) {
        // Update Redux store
        dispatch({
          type: 'notifications/setSettings',
          payload: response.data,
        });
        
        setHasUnsavedChanges(false);
        
        Alert.alert(
          'Success',
          'Notification settings updated successfully',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert(
        'Error',
        'Failed to save notification settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  }, [user.id, dispatch]);

  /**
   * Handle frequency selection
   */
  const handleFrequencyChange = useCallback((frequency: NotificationFrequency) => {
    setValue('frequency', {
      immediate: frequency === 'immediate',
      daily: frequency === 'daily',
      weekly: frequency === 'weekly',
    });
  }, [setValue]);

  /**
   * Get selected frequency
   */
  const getSelectedFrequency = (): NotificationFrequency => {
    if (watchedValues.frequency?.immediate) return 'immediate';
    if (watchedValues.frequency?.daily) return 'daily';
    if (watchedValues.frequency?.weekly) return 'weekly';
    return 'immediate';
  };

  /**
   * Handle navigation back with unsaved changes check
   */
  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
          { text: 'Save', onPress: () => handleSubmit(onSubmit)() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasUnsavedChanges, navigation, handleSubmit, onSubmit]);

  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      title: 'Notification Settings',
      headerLeft: () => (
        <Text onPress={handleBackPress} style={styles.headerButton}>
          Back
        </Text>
      ),
      headerRight: () => (
        <Text
          onPress={handleSubmit(onSubmit)}
          style={[
            styles.headerButton,
            styles.saveButton,
            (!hasUnsavedChanges || isSaving) && styles.disabledButton,
          ]}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Text>
      ),
    });
  }, [navigation, handleBackPress, handleSubmit, onSubmit, hasUnsavedChanges, isSaving]);

  if (loading && !settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications Section */}
        <Controller
          control={control}
          name="pushNotifications.enabled"
          render={({ field: { value, onChange } }) => (
            <NotificationSection
              title="Push Notifications"
              enabled={value}
              onToggle={onChange}
            >
              <Controller
                control={control}
                name="pushNotifications.messages"
                render={({ field: { value: messageValue, onChange: onMessageChange } }) => (
                  <NotificationToggle
                    title="Messages"
                    subtitle="New messages and replies"
                    value={messageValue}
                    onValueChange={onMessageChange}
                    testID="push-messages"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="pushNotifications.updates"
                render={({ field: { value: updateValue, onChange: onUpdateChange } }) => (
                  <NotificationToggle
                    title="App Updates"
                    subtitle="New features and improvements"
                    value={updateValue}
                    onValueChange={onUpdateChange}
                    testID="push-updates"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="pushNotifications.promotions"
                render={({ field: { value: promoValue, onChange: onPromoChange } }) => (
                  <NotificationToggle
                    title="Promotions"
                    subtitle="Special offers and deals"
                    value={promoValue}
                    onValueChange={onPromoChange}
                    testID="push-promotions"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="pushNotifications.reminders"
                render={({ field: { value: reminderValue, onChange: onReminderChange } }) => (
                  <NotificationToggle
                    title="Reminders"
                    subtitle="Important reminders and deadlines"
                    value={reminderValue}
                    onValueChange={onReminderChange}
                    testID="push-reminders"
                  />
                )}
              />
            </NotificationSection>
          )}
        />

        {/* Email Notifications Section */}
        <Controller
          control={control}
          name="emailNotifications.enabled"
          render={({ field: { value, onChange } }) => (
            <NotificationSection
              title="Email Notifications"
              enabled={value}
              onToggle={onChange}
            >
              <Controller
                control={control}
                name="emailNotifications.newsletter"
                render={({ field: { value: newsletterValue, onChange: onNewsletterChange } }) => (
                  <NotificationToggle
                    title="Newsletter"
                    subtitle="Weekly newsletter and updates"
                    value={newsletterValue}
                    onValueChange={onNewsletterChange}
                    testID="email-newsletter"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="emailNotifications.updates"
                render={({ field: { value: updateValue, onChange: onUpdateChange } }) => (
                  <NotificationToggle
                    title="Product Updates"
                    subtitle="New features and announcements"
                    value={updateValue}
                    onValueChange={onUpdateChange}
                    testID="email-updates"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="emailNotifications.promotions"
                render={({ field: { value: promoValue, onChange: onPromoChange } }) => (
                  <NotificationToggle
                    title="Promotional Emails"
                    subtitle="Marketing emails and offers"
                    value={promoValue}
                    onValueChange={onPromoChange}
                    testID="email-promotions"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="emailNotifications.security"
                render={({ field: { value: securityValue, onChange: onSecurityChange } }) => (
                  <NotificationToggle
                    title="Security Alerts"
                    subtitle="Account security notifications"
                    value={securityValue}
                    onValueChange={onSecurityChange}
                    testID="email-security"
                  />
                )}
              />
            </NotificationSection>
          )}
        />

        {/* SMS Notifications Section */}
        <Controller
          control={control}
          name="smsNotifications.enabled"
          render={({ field: { value, onChange } }) => (
            <NotificationSection
              title="SMS Notifications"
              enabled={value}
              onToggle={onChange}
            >
              <Controller
                control={control}
                name="smsNotifications.alerts"
                render={({ field: { value: alertValue, onChange: onAlertChange } }) => (
                  <NotificationToggle
                    title="Important Alerts"
                    subtitle="Critical notifications via SMS"
                    value={alertValue}
                    onValueChange={onAlertChange}
                    testID="sms-alerts"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="smsNotifications.reminders"
                render={({ field: { value: reminderValue, onChange: onReminderChange } }) => (
                  <NotificationToggle
                    title="Reminders"
                    subtitle="Appointment and deadline reminders"
                    value={reminderValue}
                    onValueChange={onReminderChange}
                    testID="sms-reminders"
                  />
                )}
              />
              
              <Controller
                control={control}
                name="smsNotifications.security"
                render={({ field: { value: securityValue, onChange: onSecurityChange } }) => (
                  <NotificationToggle
                    title="Security Codes"
                    subtitle="Two-factor authentication codes"
                    value={securityValue}
                    onValueChange={onSecurityChange}
                    testID="sms-security"
                  />
                )}
              />
            </NotificationSection>
          )}
        />

        {/* Notification Frequency Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notification Frequency</Text>
          <View style={styles.frequencyContainer}>
            {(['immediate', 'daily', 'weekly'] as NotificationFrequency[]).map((frequency) => (
              <NotificationToggle
                key={frequency}
                title={frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                subtitle={
                  frequency === 'immediate' ? 'Receive notifications as they happen' :
                  frequency === 'daily' ? 'Daily digest of notifications' :
                  'Weekly summary of notifications'
                }
                value={getSelectedFrequency() === frequency}
                onValueChange={() => handleFrequencyChange(frequency)}
                testID={`frequency-${frequency}`}
              />
            ))}
          </View>
        </View>

        {/* Quiet Hours Section */}
        <Controller
          control={control}
          name="quietHours.enabled"
          render={({ field: { value, onChange } }) => (
            <NotificationSection
              title="Quiet Hours"
              enabled={value}
              onToggle={onChange}
            >
              <View style={styles.quietHoursContainer}>
                <Text style={styles.quietHoursText}>
                  No notifications between {watchedValues.quietHours?.startTime} and {watchedValues.quietHours?.endTime}
                </Text>
                {/* Time picker components would go here */}
              </View>
            </NotificationSection>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  headerButton: {
    fontSize: 16,
    color: '#007AFF',
    paddingHorizontal: 16,
  },
  saveButton: {
    fontWeight: '600',
  },
  disabledButton: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    padding: 20,
    paddingBottom: 0,
  },
  frequencyContainer: {
    paddingTop: 10,
  },
  quietHoursContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  quietHoursText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default NotificationSettingsScreen;