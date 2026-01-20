import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack Navigator Types
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Modal: { title: string; content: string };
  ProductDetail: { productId: string };
  Profile: { userId?: string };
  Settings: undefined;
  Notifications: undefined;
};

// Bottom Tab Navigator Types
export type TabParamList = {
  Home: undefined;
  Search: { query?: string };
  Cart: undefined;
  Profile: undefined;
  More: undefined;
};

// Auth Stack Navigator Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Home Stack Navigator Types
export type HomeStackParamList = {
  HomeScreen: undefined;
  ProductList: { category?: string };
  ProductDetail: { productId: string };
};

// Search Stack Navigator Types
export type SearchStackParamList = {
  SearchScreen: { query?: string };
  SearchResults: { query: string };
  FilterScreen: undefined;
};

// Cart Stack Navigator Types
export type CartStackParamList = {
  CartScreen: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
};

// Profile Stack Navigator Types
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  OrderHistory: undefined;
  Wishlist: undefined;
};

// More Stack Navigator Types
export type MoreStackParamList = {
  MoreScreen: undefined;
  Settings: undefined;
  Help: undefined;
  About: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>;

// Navigation State Types
export interface NavigationState {
  isReady: boolean;
  initialRouteName?: string;
  deepLinkUrl?: string;
}

// Tab Badge Types
export interface TabBadge {
  count?: number;
  showDot?: boolean;
  color?: string;
}

export interface TabBadges {
  Home?: TabBadge;
  Search?: TabBadge;
  Cart?: TabBadge;
  Profile?: TabBadge;
  More?: TabBadge;
}

// Deep Link Types
export interface DeepLinkConfig {
  screens: {
    Main: {
      screens: {
        Home: 'home';
        Search: 'search/:query?';
        Cart: 'cart';
        Profile: 'profile';
        More: 'more';
      };
    };
    ProductDetail: 'product/:productId';
    Profile: 'user/:userId?';
    Settings: 'settings';
    Notifications: 'notifications';
  };
}

// Navigation Theme Types
export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    tabBarBackground: string;
    tabBarActiveTint: string;
    tabBarInactiveTint: string;
  };
}