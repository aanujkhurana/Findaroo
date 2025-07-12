import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LocationCoords } from '../types';
import { getAddressFromCoordinates } from '../utils/location';

interface LocationPickerProps {
  currentLocation: LocationCoords | null;
  onLocationChange: (location: LocationCoords) => void;
  onClose: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLocation,
  onLocationChange,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationCoords[]>([]);

  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    setSearching(true);
    try {
      console.log('[LocationPicker] Searching for:', searchText);
      
      // Use Expo Location geocoding to search for addresses
      const results = await Location.geocodeAsync(searchText);
      
      if (results.length === 0) {
        Alert.alert('No Results', 'No locations found for your search. Try a different search term.');
        setSearchResults([]);
        return;
      }

      // Convert results to our LocationCoords format
      const locationResults: LocationCoords[] = [];
      
      for (const result of results.slice(0, 5)) { // Limit to 5 results
        try {
          const address = await getAddressFromCoordinates(result.latitude, result.longitude);
          locationResults.push({
            latitude: result.latitude,
            longitude: result.longitude,
            address: address,
          });
        } catch (error) {
          console.error('[LocationPicker] Error getting address for result:', error);
        }
      }

      setSearchResults(locationResults);
      console.log('[LocationPicker] Search results:', locationResults);
    } catch (error) {
      console.error('[LocationPicker] Search error:', error);
      Alert.alert('Error', 'Failed to search for location. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (location: LocationCoords) => {
    console.log('[LocationPicker] Location selected:', location);
    onLocationChange(location);
    onClose();
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      selectLocation(currentLocation);
    } else {
      Alert.alert('Error', 'Current location not available');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Location</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {currentLocation && (
        <TouchableOpacity style={styles.currentLocationButton} onPress={useCurrentLocation}>
          <Feather name="map-pin" size={20} color="#22c55e" />
          <View style={styles.currentLocationText}>
            <Text style={styles.currentLocationLabel}>Use Current Location</Text>
            <Text style={styles.currentLocationAddress}>{currentLocation.address}</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchLocation}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity 
          style={[styles.searchButton, searching && styles.searchButtonDisabled]} 
          onPress={searchLocation}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Search Results</Text>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItem}
              onPress={() => selectLocation(result)}
            >
              <Feather name="map-pin" size={16} color="#6b7280" />
              <Text style={styles.resultText}>{result.address}</Text>
              <Feather name="chevron-right" size={16} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.helpText}>
        💡 Search for an address, landmark, or city name to set your location manually
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  closeButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  currentLocationText: {
    marginLeft: 12,
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  currentLocationAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 8,
    color: '#222',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    marginLeft: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
