import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** Whether device is connected to internet */
  isConnected: boolean;
  /** Whether device is online (connected and reachable) */
  isOnline: boolean;
  /** Type of connection (wifi, cellular, etc.) */
  connectionType: NetInfoStateType;
  /** Whether connection is expensive (cellular data) */
  isExpensive: boolean;
  /** Connection strength (0-4, null if unknown) */
  strength: number | null;
  /** Whether currently checking network status */
  isLoading: boolean;
  /** Last time network status was updated */
  lastUpdated: Date | null;
}

export interface UseNetworkStatusReturn extends NetworkStatus {
  /** Manually refresh network status */
  refresh: () => Promise<void>;
  /** Check if network is available for heavy operations */
  canPerformHeavyOperations: () => boolean;
  /** Get network status description */
  getStatusDescription: () => string;
}

/**
 * Custom hook for monitoring network connectivity status
 * Provides real-time network status updates and utility functions
 */
export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isOnline: false,
    connectionType: NetInfoStateType.unknown,
    isExpensive: false,
    strength: null,
    isLoading: true,
    lastUpdated: null,
  });

  /**
   * Update network status from NetInfo state
   */
  const updateNetworkStatus = useCallback((state: NetInfoState) => {
    setNetworkStatus({
      isConnected: state.isConnected ?? false,
      isOnline: state.isInternetReachable ?? false,
      connectionType: state.type,
      isExpensive: state.details?.isConnectionExpensive ?? false,
      strength: getConnectionStrength(state),
      isLoading: false,
      lastUpdated: new Date(),
    });
  }, []);

  /**
   * Manually refresh network status
   */
  const refresh = useCallback(async (): Promise<void> => {
    setNetworkStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const state = await NetInfo.fetch();
      updateNetworkStatus(state);
    } catch (error) {
      console.error('Failed to fetch network status:', error);
      setNetworkStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateNetworkStatus]);

  /**
   * Check if network is suitable for heavy operations
   */
  const canPerformHeavyOperations = useCallback((): boolean => {
    const { isOnline, connectionType, isExpensive } = networkStatus;
    
    if (!isOnline) return false;
    
    // Allow heavy operations on WiFi
    if (connectionType === NetInfoStateType.wifi) return true;
    
    // Be cautious with cellular/expensive connections
    if (isExpensive || connectionType === NetInfoStateType.cellular) {
      // Only allow if connection is strong
      return (networkStatus.strength ?? 0) >= 3;
    }
    
    return true;
  }, [networkStatus]);

  /**
   * Get human-readable network status description
   */
  const getStatusDescription = useCallback((): string => {
    const { isOnline, isConnected, connectionType, isExpensive } = networkStatus;
    
    if (!isConnected) {
      return 'No internet connection';
    }
    
    if (!isOnline) {
      return 'Connected but no internet access';
    }
    
    let description = 'Connected';
    
    switch (connectionType) {
      case NetInfoStateType.wifi:
        description += ' via WiFi';
        break;
      case NetInfoStateType.cellular:
        description += ' via Cellular';
        if (isExpensive) {
          description += ' (Data charges may apply)';
        }
        break;
      case NetInfoStateType.ethernet:
        description += ' via Ethernet';
        break;
      default:
        description += ` via ${connectionType}`;
    }
    
    return description;
  }, [networkStatus]);

  // Set up network status listener
  useEffect(() => {
    // Initial fetch
    refresh();
    
    // Subscribe to network status changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);
    
    return unsubscribe;
  }, [refresh, updateNetworkStatus]);

  return {
    ...networkStatus,
    refresh,
    canPerformHeavyOperations,
    getStatusDescription,
  };
};

/**
 * Hook for simple online/offline detection
 */
export const useOnlineStatus = () => {
  const { isOnline, isLoading } = useNetworkStatus();
  return { isOnline, isLoading };
};

/**
 * Hook that triggers callback when network status changes
 */
export const useNetworkStatusCallback = (
  callback: (status: NetworkStatus) => void,
  dependencies: React.DependencyList = []
) => {
  const networkStatus = useNetworkStatus();
  
  useEffect(() => {
    callback(networkStatus);
  }, [networkStatus.isOnline, networkStatus.connectionType, ...dependencies]);
  
  return networkStatus;
};

/**
 * Get connection strength from NetInfo state
 */
const getConnectionStrength = (state: NetInfoState): number | null => {
  if (state.type === NetInfoStateType.wifi && state.details) {
    // WiFi strength is typically in dBm, convert to 0-4 scale
    const strength = (state.details as any).strength;
    if (typeof strength === 'number') {
      if (strength >= -50) return 4; // Excellent
      if (strength >= -60) return 3; // Good
      if (strength >= -70) return 2; // Fair
      if (strength >= -80) return 1; // Poor
      return 0; // Very poor
    }
  }
  
  if (state.type === NetInfoStateType.cellular && state.details) {
    // Cellular strength varies by platform
    const details = state.details as any;
    if (details.cellularGeneration) {
      // Rough estimation based on cellular generation
      switch (details.cellularGeneration) {
        case '5g': return 4;
        case '4g': return 3;
        case '3g': return 2;
        case '2g': return 1;
        default: return 1;
      }
    }
  }
  
  return null;
};