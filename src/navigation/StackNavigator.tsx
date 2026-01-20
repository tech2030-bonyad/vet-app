import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { StatusBar } from 'react-native';

import TabNavigator from './TabNavigator';
import { RootStackParamList, NavigationTheme } from './NavigationTypes';
import { RootState } from '../store/store';

// Screen Components (these would be imported from your screens directory)
import AuthNavigator from './AuthNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ModalScreen from '../screens/ModalScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Search: 'search/:query?',
          Cart: 'cart',
          Profile: 'profile',
          More: 'more',
        },
      },
      ProductDetail: 'product/:productId',
      Profile: 'user/:userId?',
      Settings: 'settings',
      Notifications: 'notifications',
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
    },
  },
};

// Custom navigation theme
const lightTheme: NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E5',
    notification: '#FF3B30',
    tabBarBackground: '#FFFFFF',
    tabBarActiveTint: '#007AFF',
    tabBarInactiveTint: '#8E8E93',
  },
};

const darkTheme: NavigationTheme = {
  dark: true,
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    tabBarBackground: '#1C1C1E',
    tabBarActiveTint: '#0A84FF',
    tabBarInactiveTint: '#8E8E93',
  },
};

interface StackNavigatorProps {
  onReady?: () => void;
}

const StackNavigator: React.FC<StackNavigatorProps> = ({ onReady }) => {
  const { isAuthenticated, theme } = useSelector((state: RootState) => ({
    isAuthenticated: state.auth.isAuthenticated,
    theme: state.app.theme,
  }));

  const navigationTheme = theme === 'dark' ? darkTheme : lightTheme;

  /**
   * Handle navigation state changes for analytics and debugging
   */
  const handleStateChange = (state: any) => {
    if (__DEV__) {
      console.log('Navigation state changed:', state);
    }
    
    // Track screen views for analytics
    const currentRoute = getCurrentRoute(state);
    if (currentRoute) {
      // Analytics.trackScreenView(currentRoute.name, currentRoute.params);
    }
  };

  /**
   * Get current route from navigation state
   */
  const getCurrentRoute = (state: any): { name: string; params?: any } | null => {
    if (!state || !state.routes || state.routes.length === 0) {
      return null;
    }

    const route = state.routes[state.index];
    
    if (route.state) {
      return getCurrentRoute(route.state);
    }

    return {
      name: route.name,
      params: route.params,
    };
  };

  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={linking}
      onReady={onReady}
      onStateChange={handleStateChange}
      fallback={null} // You can add a loading component here
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={navigationTheme.colors.background}
      />
      
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Auth'}
        screenOptions={{
          headerStyle: {
            backgroundColor: navigationTheme.colors.card,
            borderBottomColor: navigationTheme.colors.border,
          },
          headerTintColor: navigationTheme.colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          cardStyle: {
            backgroundColor: navigationTheme.colors.background,
          },
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={({ route }) => ({
                title: 'Product Details',
                headerBackTitleVisible: false,
              })}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={({ route }) => ({
                title: route.params?.userId ? 'User Profile' : 'My Profile',
                headerBackTitleVisible: false,
              })}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                title: 'Notifications',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Modal"
              component={ModalScreen}
              options={({ route }) => ({
                title: route.params.title,
                presentation: 'modal',
                headerLeft: () => null,
              })}
            />
          </>
        ) : (
          // Authentication Stack
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;