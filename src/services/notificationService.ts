import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSettings, ApiResponse } from '../types/notification';

/**
 * Service for managing notification settings
 * Handles API calls and local storage operations
 */
class NotificationService {
  private readonly STORAGE_KEY = '@notification_settings';
  private readonly API_BASE_URL = 'https://api.yourapp.com'; // Replace with your API URL

  /**
   * Fetch notification settings from API
   */
  async getNotificationSettings(userId: string): Promise<ApiResponse<NotificationSettings>> {
    try {
      // First try to get from local storage for offline support
      const cachedSettings = await this.getCachedSettings();
      
      // Make API call
      const response = await fetch(`${this.API_BASE_URL}/users/${userId}/notification-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the settings locally
      await this.cacheSettings(data);
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      
      // Return cached settings if API fails
      const cachedSettings = await this.getCachedSettings();
      if (cachedSettings) {
        return {
          success: true,
          data: cachedSettings,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notification settings',
      };
    }
  }

  /**
   * Update notification settings via API
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<ApiResponse<NotificationSettings>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users/${userId}/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the updated settings
      await this.cacheSettings(data);
      
      return {
        success: true,
        data: data,
        message: 'Notification settings updated successfully',
      };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update notification settings',
      };
    }
  }

  /**
   * Get default notification settings
   */
  getDefaultSettings(userId: string): NotificationSettings {
    return {
      id: `settings_${userId}`,
      userId,
      pushNotifications: {
        enabled: true,
        messages: true,
        updates: true,
        promotions: false,
        reminders: true,
      },
      emailNotifications: {
        enabled: true,
        newsletter: false,
        updates: true,
        promotions: false,
        security: true,
      },
      smsNotifications: {
        enabled: false,
        alerts: false,
        reminders: false,
        security: true,
      },
      frequency: {
        immediate: true,
        daily: false,
        weekly: false,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  /**
   * Cache settings locally for offline support
   */
  private async cacheSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error caching notification settings:', error);
    }
  }

  /**
   * Get cached settings from local storage
   */
  private async getCachedSettings(): Promise<NotificationSettings | null> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached notification settings:', error);
      return null;
    }
  }

  /**
   * Get authentication token (implement based on your auth system)
   */
  private async getAuthToken(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  /**
   * Request notification permissions (iOS/Android)
   */
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      // This would typically use react-native-permissions or similar
      // For now, we'll simulate the permission request
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Clear cached settings
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notification settings cache:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;