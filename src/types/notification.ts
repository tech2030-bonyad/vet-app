// Notification types and interfaces
export interface NotificationSettings {
  id: string;
  userId: string;
  pushNotifications: {
    enabled: boolean;
    messages: boolean;
    updates: boolean;
    promotions: boolean;
    reminders: boolean;
  };
  emailNotifications: {
    enabled: boolean;
    newsletter: boolean;
    updates: boolean;
    promotions: boolean;
    security: boolean;
  };
  smsNotifications: {
    enabled: boolean;
    alerts: boolean;
    reminders: boolean;
    security: boolean;
  };
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface NotificationToggleProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

export interface NotificationSectionProps {
  title: string;
  children: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}