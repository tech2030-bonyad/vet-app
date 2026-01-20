import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Location } from '../types/clinic';

interface UseLocationReturn {
  location: Location | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  hasPermission: boolean;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  /**
   * Request location permission for Android devices
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to find nearby clinics.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(permissionGranted);
        return permissionGranted;
      } catch (err) {
        console.warn('Location permission error:', err);
        setHasPermission(false);
        return false;
      }
    }
    
    // iOS permissions are handled automatically
    setHasPermission(true);
    return true;
  };

  /**
   * Get current device location
   */
  const getCurrentLocation = (): void => {
    setLoading(true);
    setError(null);

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLoading(false);
      },
      (err) => {
        console.error('Location error:', err);
        setError('Unable to get your location. Please check your GPS settings.');
        setLoading(false);
        
        // Show user-friendly error message
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please ensure GPS is enabled and try again.',
          [{ text: 'OK' }]
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  /**
   * Request location with permission check
   */
  const requestLocation = async (): Promise<void> => {
    const hasPermission = await requestLocationPermission();
    
    if (hasPermission) {
      getCurrentLocation();
    } else {
      setError('Location permission denied');
      Alert.alert(
        'Permission Required',
        'Location permission is required to find nearby clinics. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  // Request location on component mount
  useEffect(() => {
    requestLocation();
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
    hasPermission,
  };
};