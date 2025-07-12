import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { LocationCoords } from '../types';
import { getCurrentLocation } from '../utils/location';

interface ItemMapViewProps {
  itemLocation: LocationCoords;
  itemTitle: string;
  itemStatus: 'lost' | 'found';
  showUserLocation?: boolean;
  showApproximateArea?: boolean;
  onClose?: () => void;
}

export const ItemMapView: React.FC<ItemMapViewProps> = ({
  itemLocation,
  itemTitle,
  itemStatus,
  showUserLocation = true,
  showApproximateArea = true,
  onClose,
}) => {
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: itemLocation.latitude,
    longitude: itemLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (showUserLocation) {
      getCurrentLocation().then(location => {
        if (location) {
          setUserLocation(location);
        }
      });
    }
  }, [showUserLocation]);

  const getMarkerColor = (status: 'lost' | 'found') => {
    return status === 'lost' ? '#ef4444' : '#22c55e';
  };

  const getStatusIcon = (status: 'lost' | 'found') => {
    return status === 'lost' ? '❌' : '✅';
  };

  const centerOnItem = () => {
    setMapRegion({
      latitude: itemLocation.latitude,
      longitude: itemLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const centerOnUser = () => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert('Location Not Available', 'Unable to get your current location');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>{itemTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getMarkerColor(itemStatus) }]}>
            <Text style={styles.statusText}>{itemStatus}</Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={false} // We'll handle this manually
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Item Location Marker */}
        <Marker
          coordinate={{
            latitude: itemLocation.latitude,
            longitude: itemLocation.longitude,
          }}
          title={itemTitle}
          description={`${itemStatus} item - ${itemLocation.address}`}
          pinColor={getMarkerColor(itemStatus)}
        />

        {/* Approximate Area Circle (for privacy) */}
        {showApproximateArea && (
          <Circle
            center={{
              latitude: itemLocation.latitude,
              longitude: itemLocation.longitude,
            }}
            radius={500} // 500 meter radius for approximate area
            fillColor={`${getMarkerColor(itemStatus)}20`} // 20% opacity
            strokeColor={getMarkerColor(itemStatus)}
            strokeWidth={2}
          />
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor="#3b82f6"
          />
        )}
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnItem}>
          <Feather name="map-pin" size={20} color="#fff" />
          <Text style={styles.controlButtonText}>Item</Text>
        </TouchableOpacity>
        
        {userLocation && (
          <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
            <Feather name="navigation" size={20} color="#fff" />
            <Text style={styles.controlButtonText}>Me</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.infoText}>
          📍 {itemLocation.address}
        </Text>
        {showApproximateArea && (
          <Text style={styles.privacyText}>
            🔒 Approximate area shown for privacy (±500m)
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 4,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 80,
    right: 16,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  info: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
