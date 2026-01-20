import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Platform } from 'react-native';

import { TabParamList } from './NavigationTypes';
import TabBar from '../components/navigation/TabBar';
import { RootState } from '../store/store';

// Stack Navigators for each tab
import HomeStackNavigator from './stacks/HomeStackNavigator';
import SearchStackNavigator from './stacks/SearchStackNavigator';
import CartStackNavigator from './stacks/CartStackNavigator';
import ProfileStackNavigator from './stacks/ProfileStackNavigator';
import MoreStackNavigator from './stacks/MoreStackNavigator';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
  const { cartItemsCount, notificationsCount, theme } = useSelector((state: RootState) => ({
    cartItemsCount: state.cart.items.length,
    notificationsCount: state.notifications.unreadCount,
    theme: state.app.theme,
  }));

  /**
   * Get tab badges configuration
   */
  const getTabBadges = () => ({
    Cart: {
      count: cartItemsCount > 0 ? cartItemsCount : undefined,
      color: '#FF3B30',
    },
    More: {
      showDot: notificationsCount > 0,
      color: '#FF3B30',
    },
  });

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => (
        <TabBar
          {...props}
          badges={getTabBadges()}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: theme === 'dark' ? '#38383A' : '#E5E5E5',
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home Tab',
        }}
      />
      
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Search',
          tabBarAccessibilityLabel: 'Search Tab',
        }}
        initialParams={{ query: undefined }}
      />
      
      <Tab.Screen
        name="Cart"
        component={CartStackNavigator}
        options={{
          tabBarLabel: 'Cart',
          tabBarAccessibilityLabel: 'Shopping Cart Tab',
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile Tab',
        }}
      />
      
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{
          tabBarLabel: 'More',
          tabBarAccessibilityLabel: 'More Options Tab',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;