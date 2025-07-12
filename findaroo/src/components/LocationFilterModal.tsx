import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { LocationCoords } from '../types';
import { getCurrentLocation } from '../utils/location';

interface LocationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentMaxDistance?: number;
  currentSortByDistance: boolean;
  onApplyFilters: (maxDistance: number | undefined, sortByDistance: boolean) => void;
  userLocation?: LocationCoords | null;
}

const COLORS = {
  background: '#fff',
  primary: '#2563eb',
  accent: '#fbbf24',
  text: '#222',
  muted: '#6b7280',
  border: '#e5e7eb',
  card: '#f8fafc',
  success: '#22c55e',
  error: '#ef4444',
};

const DISTANCE_OPTIONS = [
  { value: undefined, label: 'Any Distance', icon: '🌍' },
  { value: 1, label: 'Within 1km', icon: '🚶' },
  { value: 5, label: 'Within 5km', icon: '🚴' },
  { value: 10, label: 'Within 10km', icon: '🚗' },
  { value: 25, label: 'Within 25km', icon: '🚌' },
  { value: 50, label: 'Within 50km', icon: '🚄' },
];

export const LocationFilterModal: React.FC<LocationFilterModalProps> = ({
  visible,
  onClose,
  currentMaxDistance,
  currentSortByDistance,
  onApplyFilters,
  userLocation: propUserLocation,
}) => {
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(propUserLocation || null);
  const [loading, setLoading] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(currentMaxDistance);
  const [sortByDistance, setSortByDistance] = useState(currentSortByDistance);
  const [sliderDistance, setSliderDistance] = useState(currentMaxDistance || 10);

  useEffect(() => {
    if (visible && !userLocation) {
      fetchUserLocation();
    }
  }, [visible]);

  useEffect(() => {
    setMaxDistance(currentMaxDistance);
    setSortByDistance(currentSortByDistance);
    setSliderDistance(currentMaxDistance || 10);
  }, [currentMaxDistance, currentSortByDistance]);

  const fetchUserLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
      } else {
        Alert.alert('Location Error', 'Unable to get your current location. Please check location permissions.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters(maxDistance, sortByDistance);
  };

  const handleSliderChange = (value: number) => {
    setSliderDistance(value);
    setMaxDistance(value);
  };

  const handleDistanceOptionPress = (distance: number | undefined) => {
    setMaxDistance(distance);
    if (distance) {
      setSliderDistance(distance);
    }
  };

  const getDistanceLabel = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={COLORS.muted} />
          </TouchableOpacity>
          <Text style={styles.title}>Location Filter</Text>
          <TouchableOpacity onPress={handleApplyFilters} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : userLocation ? (
          <>
            {/* Current Location Display */}
            <View style={styles.locationInfo}>
              <View style={styles.locationHeader}>
                <Feather name="map-pin" size={20} color={COLORS.success} />
                <Text style={styles.locationTitle}>Current Location</Text>
              </View>
              <Text style={styles.locationAddress}>{userLocation.address}</Text>
            </View>

            {/* Distance Slider */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderTitle}>Search Radius</Text>
              <View style={styles.sliderWrapper}>
                <Text style={styles.sliderLabel}>Distance: {getDistanceLabel(sliderDistance)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={50}
                  value={sliderDistance}
                  onValueChange={handleSliderChange}
                  step={0.5}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.border}
                  thumbStyle={styles.sliderThumb}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderEndLabel}>500m</Text>
                  <Text style={styles.sliderEndLabel}>50km</Text>
                </View>
              </View>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
              >
                {/* User Location Marker */}
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="Your Location"
                  description="You are here"
                >
                  <View style={styles.userMarker}>
                    <Feather name="navigation" size={16} color="#fff" />
                  </View>
                </Marker>

                {/* Distance Circle */}
                {maxDistance && (
                  <Circle
                    center={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    radius={maxDistance * 1000} // Convert km to meters
                    fillColor={`${COLORS.primary}20`} // 20% opacity
                    strokeColor={COLORS.primary}
                    strokeWidth={2}
                  />
                )}
              </MapView>
            </View>

            {/* Quick Distance Options */}
            <View style={styles.quickOptions}>
              <Text style={styles.quickOptionsTitle}>Quick Options</Text>
              <View style={styles.quickOptionsGrid}>
                {DISTANCE_OPTIONS.map((option) => {
                  const isSelected = maxDistance === option.value;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[styles.quickOption, isSelected && styles.quickOptionSelected]}
                      onPress={() => handleDistanceOptionPress(option.value)}
                    >
                      <Text style={styles.quickOptionIcon}>{option.icon}</Text>
                      <Text style={[styles.quickOptionText, isSelected && styles.quickOptionTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort Option */}
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortOption, sortByDistance && styles.sortOptionSelected]}
                onPress={() => setSortByDistance(!sortByDistance)}
              >
                <Feather 
                  name={sortByDistance ? "check-square" : "square"} 
                  size={20} 
                  color={sortByDistance ? COLORS.primary : COLORS.muted} 
                />
                <Text style={[styles.sortOptionText, sortByDistance && styles.sortOptionTextSelected]}>
                  Sort by distance (closest first)
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Feather name="map-pin" size={48} color={COLORS.muted} />
            <Text style={styles.errorTitle}>Location Required</Text>
            <Text style={styles.errorText}>
              We need your location to show nearby items. Please enable location permissions and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUserLocation}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.muted,
  },
  locationInfo: {
    padding: 20,
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  sliderContainer: {
    padding: 20,
  },
  sliderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  sliderWrapper: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderEndLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  quickOptions: {
    padding: 20,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  quickOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickOptionText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  quickOptionTextSelected: {
    color: '#fff',
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  sortOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
