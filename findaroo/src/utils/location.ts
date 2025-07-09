import * as Location from 'expo-location';
import { LocationCoords } from '../types';

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Get address from coordinates
    const address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    const addressString = address[0] ? 
      `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim() : 
      'Unknown location';

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: addressString,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const address = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (address[0]) {
      return `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim();
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Unknown location';
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
