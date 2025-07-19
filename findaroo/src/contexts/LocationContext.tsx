import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationCoords } from '../types';
import { getCurrentLocation, checkLocationPermissions, requestLocationPermissions } from '../utils/location';

interface LocationContextType {
  userLocation: LocationCoords | null;
  locationPermissionGranted: boolean;
  locationLoading: boolean;
  locationError: string | null;
  refreshLocation: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

const LOCATION_STORAGE_KEY = 'userLocation';
const LOCATION_PERMISSION_ASKED_KEY = 'locationPermissionAsked';

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load cached location on app start
  useEffect(() => {
    loadCachedLocation();
    checkInitialPermissions();
  }, []);

  // Listen for app state changes to refresh location when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && locationPermissionGranted && !userLocation) {
        refreshLocation();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [locationPermissionGranted, userLocation]);

  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cachedLocation) {
        const location = JSON.parse(cachedLocation);
        // Check if cached location is less than 1 hour old
        const now = Date.now();
        const locationAge = now - (location.timestamp || 0);
        const oneHour = 60 * 60 * 1000;
        
        if (locationAge < oneHour) {
          setUserLocation(location);
          console.log('[LocationProvider] Loaded cached location:', location);
        } else {
          console.log('[LocationProvider] Cached location is too old, will refresh');
          await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('[LocationProvider] Error loading cached location:', error);
    }
  };

  const saveCachedLocation = async (location: LocationCoords) => {
    try {
      const locationWithTimestamp = {
        ...location,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationWithTimestamp));
      console.log('[LocationProvider] Saved location to cache');
    } catch (error) {
      console.error('[LocationProvider] Error saving location to cache:', error);
    }
  };

  const checkInitialPermissions = async () => {
    try {
      const permissions = await checkLocationPermissions();
      setLocationPermissionGranted(permissions.granted);
      
      if (permissions.granted) {
        // If we have permission but no location, get it
        if (!userLocation) {
          refreshLocation();
        }
      } else {
        // Check if we've already asked for permission
        const hasAsked = await AsyncStorage.getItem(LOCATION_PERMISSION_ASKED_KEY);
        if (!hasAsked) {
          // First time opening app, ask for permission
          setTimeout(() => {
            requestLocationPermission();
          }, 1000); // Small delay to let app fully load
        }
      }
    } catch (error) {
      console.error('[LocationProvider] Error checking initial permissions:', error);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      // Mark that we've asked for permission
      await AsyncStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, 'true');

      const granted = await requestLocationPermissions();
      setLocationPermissionGranted(granted);

      if (granted) {
        await refreshLocation();
        return true;
      } else {
        setLocationError('Location permission is required for distance calculations');
        Alert.alert(
          'Location Permission Required',
          'Findaroo needs location access to show distances to lost and found items. You can enable this in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {/* TODO: Open app settings */} }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('[LocationProvider] Error requesting permission:', error);
      setLocationError('Failed to request location permission');
      return false;
    } finally {
      setLocationLoading(false);
    }
  };

  const refreshLocation = async (): Promise<void> => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        await saveCachedLocation(location);
        console.log('[LocationProvider] Location updated:', location);
      } else {
        setLocationError('Unable to get current location');
      }
    } catch (error) {
      console.error('[LocationProvider] Error refreshing location:', error);
      setLocationError('Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const value: LocationContextType = {
    userLocation,
    locationPermissionGranted,
    locationLoading,
    locationError,
    refreshLocation,
    requestLocationPermission,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
