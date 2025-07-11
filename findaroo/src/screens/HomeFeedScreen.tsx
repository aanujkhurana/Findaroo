import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '../hooks/useItems';
import { ItemCard } from '../components/ItemCard';
import { Loading } from '../components/Loading';
import { Category } from '../types';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

// Minimal color palette
const COLORS = {
  background: '#fff',
  primary: '#2563eb',
  accent: '#fbbf24',
  text: '#222',
  muted: '#6b7280',
  border: '#e5e7eb',
  card: '#f8fafc',
};

const CATEGORIES = [
  { value: undefined, label: 'All', icon: <Feather name="grid" size={16} color={COLORS.primary} /> },
  { value: 'lost', label: 'Lost', icon: <Feather name="alert-circle" size={16} color={COLORS.primary} /> },
  { value: 'found', label: 'Found', icon: <Feather name="check-circle" size={16} color={COLORS.primary} /> },
  // Add more categories as needed
];

function parsePointString(pointStr: string | undefined) {
    if (!pointStr || typeof pointStr !== 'string') return null;
  const match = pointStr.match(/POINT\((-?\d+\.\d+) (-?\d+\.\d+)\)/);
  if (match) {
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  }
  return null;
}

// Add type guard for location object
function isLocationObject(value: any): value is { address: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.address === 'string'
  );
}

export const HomeFeedScreen = ({ navigation }: any) => {
  const [status, setStatus] = useState<'lost' | 'found' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [category, setCategory] = useState();

  const filters = useMemo(() => ({
    status,
    category,
    search: search.trim() || undefined,
  }), [status, category, search]);

  const { items, loading, error, refetch } = useItems(filters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Minimal filtered items
  const filteredItems = items;

  if (loading && !refreshing) {
    return <Loading message="Loading items..." />;
  }
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading items: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sticky Minimal Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Findaroo</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="notifications-none" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarCircle}>
            <Ionicons name="person" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={COLORS.muted} style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search lost & found items…"
          placeholderTextColor={COLORS.muted}
        />
      </View>

      {/* Pill Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.filterPill, (status === cat.value || (!status && cat.value === undefined)) && styles.filterPillActive]}
            onPress={() => setStatus(cat.value as 'lost' | 'found' | undefined)}
          >
            {cat.icon}
            <Text style={[styles.filterPillText, (status === cat.value || (!status && cat.value === undefined)) && styles.filterPillTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map Preview Row */}
      <TouchableOpacity onPress={() => setMapModalVisible(true)} activeOpacity={0.85}>
        <View style={styles.mapPreviewRow}>
          <MapView
            style={styles.mapPreview}
            initialRegion={{
              latitude: -33.8688,
              longitude: 151.2093,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            pointerEvents="none"
          >
            {filteredItems.map((item) => {
              const coords = parsePointString(item.location);
              return coords ? (
                <Marker
                  key={item.id}
                  coordinate={coords}
                  title={item.title}
                  description={item.description}
                >
                  <View style={[styles.markerCircle, item.status === 'lost' ? styles.markerLost : styles.markerFound]}>
                    <MaterialIcons name={item.status === 'lost' ? 'report-problem' : 'check-circle'} size={16} color={'#fff'} />
                  </View>
                </Marker>
              ) : null;
            })}
          </MapView>
          <TouchableOpacity style={styles.mapExpandBtn} onPress={() => setMapModalVisible(true)}>
            <Feather name="maximize-2" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Map Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <MaterialIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginLeft: 12 }}>Map View</Text>
          </View>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: -33.8688,
              longitude: 151.2093,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {filteredItems.map((item) => {
              const coords = parsePointString(item.location);
              return coords ? (
                <Marker
                  key={item.id}
                  coordinate={coords}
                  title={item.title}
                  description={item.description}
                >
                  <View style={[styles.markerCircle, item.status === 'lost' ? styles.markerLost : styles.markerFound]}>
                    <MaterialIcons name={item.status === 'lost' ? 'report-problem' : 'check-circle'} size={20} color={'#fff'} />
                  </View>
                </Marker>
              ) : null;
            })}
          </MapView>
        </SafeAreaView>
      </Modal>

      {/* Items List - Minimal Card Design */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            )}
            <View style={styles.itemInfo}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.statusBadge, item.status === 'lost' ? styles.statusLost : styles.statusFound]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemLocation} numberOfLines={1}>{
                isLocationObject(item.location)
                  ? item.location.address
                  : 'Location'
              }</Text>
              <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={COLORS.muted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No items found. Try adjusting your filters.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // Show action sheet or navigate to create
          navigation.navigate('CreateLostItem');
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  logo: { fontWeight: 'bold', fontSize: 22, color: COLORS.primary, letterSpacing: 1 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { marginLeft: 12 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: 'transparent',
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    color: COLORS.text,
  },
  filterPillText: {
    color: COLORS.text,
    fontSize: 12,
    marginLeft: 16,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  mapPreviewRow: {
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  mapExpandBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  markerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLost: { backgroundColor: '#f87171' },
  markerFound: { backgroundColor: '#22c55e' },
  mapPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPreviewText: {
    color: COLORS.muted,
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: COLORS.background,
  },
  itemInfo: { flex: 1 },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontWeight: 'bold', fontSize: 16, color: COLORS.text, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  statusLost: { backgroundColor: '#fee2e2' },
  statusFound: { backgroundColor: '#d1fae5' },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, textTransform: 'capitalize' },
  itemCategory: { color: COLORS.primary, fontSize: 13, marginTop: 2 },
  itemLocation: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  itemDate: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyText: { color: COLORS.muted, fontSize: 16, marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 12 },
});
