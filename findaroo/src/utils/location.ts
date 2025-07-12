import * as Location from 'expo-location';
import { LocationCoords } from '../types';

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    console.log('[getCurrentLocation] Requesting location permissions...');

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('[getCurrentLocation] Location permission denied');
      throw new Error('Location permission not granted');
    }

    console.log('[getCurrentLocation] Permission granted, getting current position...');

    // Get current position with timeout and fallback
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced for better performance
      timeout: 15000, // 15 second timeout
      maximumAge: 60000, // Accept cached location up to 1 minute old
    });

    console.log('[getCurrentLocation] Got coordinates:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });

    // Get address from coordinates
    const address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    console.log('[getCurrentLocation] Reverse geocoding result:', address[0]);

    const addressString = address[0] ?
      formatAddress(address[0]) :
      'Unknown location';

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: addressString,
    };

    console.log('[getCurrentLocation] Final result:', result);
    return result;
  } catch (error) {
    console.error('[getCurrentLocation] Error getting location:', error);
    return null;
  }
};

// Helper function to format address consistently
const formatAddress = (addressComponent: Location.LocationGeocodedAddress): string => {
  const parts = [];

  if (addressComponent.streetNumber) parts.push(addressComponent.streetNumber);
  if (addressComponent.street) parts.push(addressComponent.street);
  if (addressComponent.city) parts.push(addressComponent.city);
  if (addressComponent.region) parts.push(addressComponent.region);

  return parts.join(', ') || 'Unknown location';
};

export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    console.log('[getAddressFromCoordinates] Getting address for:', { latitude, longitude });

    const address = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    console.log('[getAddressFromCoordinates] Reverse geocoding result:', address[0]);

    if (address[0]) {
      return formatAddress(address[0]);
    }

    return 'Unknown location';
  } catch (error) {
    console.error('[getAddressFromCoordinates] Error getting address:', error);
    return 'Unknown location';
  }
};

// Function to check if location services are enabled
export const checkLocationPermissions = async (): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}> => {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  } catch (error) {
    console.error('[checkLocationPermissions] Error checking permissions:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'undetermined' as Location.PermissionStatus,
    };
  }
};

// Function to request location permissions with better error handling
export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    console.log('[requestLocationPermissions] Requesting location permissions...');

    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';

    console.log('[requestLocationPermissions] Permission result:', { status, granted });
    return granted;
  } catch (error) {
    console.error('[requestLocationPermissions] Error requesting permissions:', error);
    return false;
  }
};

export const calculateDistance = (coords1: LocationCoords, coords2: LocationCoords): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
  const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.latitude * Math.PI / 180) * Math.cos(coords2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

// Check if location is within radius
export const isWithinRadius = (
  userLocation: LocationCoords,
  itemLocation: LocationCoords,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(userLocation, itemLocation);
  return distance <= radiusKm;
};

// Filter items by distance
export const filterItemsByDistance = <T extends { location?: LocationCoords }>(
  items: T[],
  userLocation: LocationCoords,
  maxDistanceKm: number
): T[] => {
  return items.filter(item => {
    if (!item.location) return false;
    return isWithinRadius(userLocation, item.location, maxDistanceKm);
  });
};

// Sort items by distance (closest first)
export const sortItemsByDistance = <T extends { location?: LocationCoords }>(
  items: T[],
  userLocation: LocationCoords
): (T & { distance?: number })[] => {
  return items
    .map(item => ({
      ...item,
      distance: item.location ? calculateDistance(userLocation, item.location) : undefined
    }))
    .sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
};

// Get nearby items within different radius options
export const getNearbyItems = <T extends { location?: LocationCoords }>(
  items: T[],
  userLocation: LocationCoords,
  radiusKm: number = 10
): (T & { distance: number })[] => {
  return items
    .filter(item => item.location && isWithinRadius(userLocation, item.location, radiusKm))
    .map(item => ({
      ...item,
      distance: calculateDistance(userLocation, item.location!)
    }))
    .sort((a, b) => a.distance - b.distance);
};
