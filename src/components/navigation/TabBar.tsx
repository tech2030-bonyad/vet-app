import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import { TabBadges } from '../../navigation/NavigationTypes';
import { RootState } from '../../store/store';
import Icon from '../common/Icon';

const { width: screenWidth } = Dimensions.get('window');

interface TabBarProps extends BottomTabBarProps {
  badges?: TabBadges;
}

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
}

interface BadgeProps {
  count?: number;
  showDot?: boolean;
  color?: string;
}

/**
 * Custom tab icon component with proper icon mapping
 */
const TabIcon: React.FC<TabIconProps> = ({ name, focused, color, size = 24 }) => {
  const iconMap: Record<string, { focused: string; unfocused: string }> = {
    Home: { focused: 'home', unfocused: 'home-outline' },
    Search: { focused: 'search', unfocused: 'search-outline' },
    Cart: { focused: 'shopping-cart', unfocused: 'shopping-cart-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
    More: { focused: 'menu', unfocused: 'menu-outline' },
  };

  const iconName = iconMap[name]?.[focused ? 'focused' : 'unfocused'] || 'help-circle';

  return (
    <Icon
      name={iconName}
      size={size}
      color={color}
    />
  );
};

/**
 * Badge component for tab notifications
 */
const Badge: React.FC<BadgeProps> = ({ count, showDot, color = '#FF3B30' }) => {
  if (!count && !showDot) return null;

  const badgeStyle = [
    styles.badge,
    { backgroundColor: color },
    showDot && !count && styles.dotBadge,
  ];

  return (
    <View style={badgeStyle}>
      {count && count > 0 && (
        <Text style={styles.badgeText}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      )}
    </View>
  );
};

/**
 * Custom Tab Bar Component with animations and badges
 */
const TabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation, badges = {} }) => {
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.app.theme);
  
  // Animation values for each tab
  const animatedValues = state.routes.map(() => useSharedValue(0));

  React.useEffect(() => {
    // Animate the active tab
    animatedValues.forEach((value, index) => {
      value.value = withSpring(state.index === index ? 1 : 0, {
        damping: 15,
        stiffness: 150,
      });
    });
  }, [state.index]);

  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#38383A' : '#E5E5E5';
  const activeColor = isDark ? '#0A84FF' : '#007AFF';
  const inactiveColor = isDark ? '#8E8E93' : '#8E8E93';

  /**
   * Handle tab press with haptic feedback
   */
  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        // HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
      }
      
      navigation.navigate(route.name, route.params);
    }
  };

  /**
   * Handle tab long press
   */
  const handleTabLongPress = (route: any) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderTopColor: borderColor,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;
        const animatedValue = animatedValues[index];

        // Animated styles for tab items
        const animatedTabStyle = useAnimatedStyle(() => {
          const scale = interpolate(animatedValue.value, [0, 1], [1, 1.1]);
          const translateY = interpolate(animatedValue.value, [0, 1], [0, -2]);

          return {
            transform: [{ scale }, { translateY }],
          };
        });

        const animatedLabelStyle = useAnimatedStyle(() => {
          const opacity = interpolate(animatedValue.value, [0, 1], [0.6, 1]);
          
          return {
            opacity,
          };
        });

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={() => handleTabPress(route, isFocused)}
            onLongPress={() => handleTabLongPress(route)}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.tabContent, animatedTabStyle]}>
              <View style={styles.iconContainer}>
                <TabIcon
                  name={route.name}
                  focused={isFocused}
                  color={isFocused ? activeColor : inactiveColor}
                  size={24}
                />
                <Badge {...badges[route.name as keyof TabBadges]} />
              </View>
              
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                  },
                  animatedLabelStyle,
                ]}
                numberOfLines={1}
              >
                {label as string}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    minWidth: 8,
    right: -4,
    top: -2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TabBar;