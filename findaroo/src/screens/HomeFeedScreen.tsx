import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '../hooks/useItems';
import { ItemCard } from '../components/ItemCard';
import { Loading } from '../components/Loading';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Category } from '../types';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

interface HomeFeedScreenProps {
  navigation: any;
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: 'electronics', label: 'Electronics', icon: <MaterialIcons name="smartphone" size={18} color="#6366F1" /> },
  { value: 'clothing', label: 'Clothing', icon: <FontAwesome name="shopping-bag" size={18} color="#6366F1" /> },
  { value: 'accessories', label: 'Accessories', icon: <MaterialIcons name="watch" size={18} color="#6366F1" /> },
  { value: 'documents', label: 'Documents', icon: <MaterialIcons name="description" size={18} color="#6366F1" /> },
  { value: 'keys', label: 'Keys', icon: <MaterialIcons name="vpn-key" size={18} color="#6366F1" /> },
  { value: 'bags', label: 'Bags', icon: <MaterialIcons name="work" size={18} color="#6366F1" /> },
  { value: 'pets', label: 'Pets', icon: <MaterialIcons name="pets" size={18} color="#6366F1" /> },
  { value: 'jewelry', label: 'Jewelry', icon: <MaterialIcons name="diamond" size={18} color="#6366F1" /> },
  { value: 'sports', label: 'Sports', icon: <Ionicons name="football" size={18} color="#6366F1" /> },
  { value: 'other', label: 'Other', icon: <MaterialIcons name="category" size={18} color="#6366F1" /> },
];

export const HomeFeedScreen: React.FC<HomeFeedScreenProps> = ({ navigation }) => {
  const [status, setStatus] = useState<'lost' | 'found' | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const handleStatusFilter = (newStatus: 'lost' | 'found' | undefined) => {
    setStatus(status === newStatus ? undefined : newStatus);
  };

  const handleCategoryFilter = (newCategory: Category) => {
    setCategory(category === newCategory ? undefined : newCategory);
  };

  const clearFilters = () => {
    setStatus(undefined);
    setCategory(undefined);
    setSearch('');
  };

  if (loading && !refreshing) {
    return <Loading message="Loading items..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error loading items: {error}
        </Text>
        <Button title="Retry" onPress={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentV2} showsVerticalScrollIndicator={false}>
        {/* Header - Redesigned v2 */}
        <View style={styles.headerRowV2}>
          <View style={styles.headerLeftV2}>
            <View style={styles.logoCircleV2}>
              <MaterialIcons name="search" size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitleV2}>Findaroo</Text>
          </View>
          <View style={styles.headerRightV2}>
            <TouchableOpacity style={styles.headerIconBtnV2}>
              <MaterialIcons name="notifications-none" size={28} color="#FACC15" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarCircleV2}>
              <Ionicons name="person" size={26} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - Redesigned v2 */}
        <View style={styles.searchBarRowV2}>
          <View style={styles.searchIconCircleV2}>
            <MaterialIcons name="search" size={22} color="#6366F1" />
          </View>
          <TextInput
            style={styles.searchInputV2}
            value={search}
            onChangeText={setSearch}
            placeholder="Search for lost items nearby..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Lost/Found Toggle - Redesigned v2 */}
        <View style={styles.toggleRowV2}>
          <TouchableOpacity
            onPress={() => handleStatusFilter('lost')}
            style={[styles.toggleBtnV2, status === 'lost' ? styles.toggleBtnActiveV2 : styles.toggleBtnInactiveV2]}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleBtnTextV2, status === 'lost' ? styles.toggleBtnTextActiveV2 : styles.toggleBtnTextInactiveV2]}>Lost something?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleStatusFilter('found')}
            style={[styles.toggleBtnV2, status === 'found' ? styles.toggleBtnActiveV2 : styles.toggleBtnInactiveV2]}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleBtnTextV2, status === 'found' ? styles.toggleBtnTextActiveV2 : styles.toggleBtnTextInactiveV2]}>Found something?</Text>
          </TouchableOpacity>
        </View>

        {/* Category Row - Redesigned v2 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollV2} contentContainerStyle={styles.categoryRowV2}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => handleCategoryFilter(cat.value)}
              style={[
                styles.categoryBtnV2,
                category === cat.value ? styles.categoryBtnActiveV2 : styles.categoryBtnInactiveV2
              ]}
              activeOpacity={0.85}
            >
              <View style={styles.categoryBtnIconV2}>{cat.icon}</View>
              <Text style={[
                styles.categoryBtnTextV2,
                category === cat.value ? styles.categoryBtnTextActiveV2 : styles.categoryBtnTextInactiveV2
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map Section - Redesigned v2 */}
        <View style={styles.mapContainerV2}>
          <MapView
            style={styles.mapV2}
            initialRegion={{
              latitude: -33.8688,
              longitude: 151.2093,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {items.filter(item => !category || item.category === category).map((item) =>
              item.location && item.location.latitude && item.location.longitude ? (
                <Marker
                  key={item.id}
                  coordinate={{
                    latitude: item.location.latitude,
                    longitude: item.location.longitude,
                  }}
                  title={item.title}
                  description={item.description}
                >
                  <View style={[styles.markerCircle, item.status === 'lost' ? styles.markerLost : styles.markerFound]}>
                    <MaterialIcons name={item.status === 'lost' ? 'report-problem' : 'check-circle'} size={22} color={'#fff'} />
                  </View>
                </Marker>
              ) : null
            )}
          </MapView>
          {/* Floating Map Buttons - Redesigned v2 */}
          <View style={styles.mapButtonsContainerV2}>
            <TouchableOpacity style={styles.mapBtnV2}>
              <MaterialIcons name="my-location" size={22} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtnV2}>
              <MaterialIcons name="filter-list" size={22} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtnPlusV2} onPress={() => navigation.navigate('CreateItem')}>
              <MaterialIcons name="add" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List - filtered by category */}
        {items.filter(item => !category || item.category === category).map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
          />
        ))}
      </ScrollView>
      {/* Floating Action Button - Redesigned */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateItem')}
        style={styles.fabNew}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    color: '#4F46E5',
  },
  headerTitleNew: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerIconBtn: {
    marginRight: 16,
  },
  headerIcon: {
    fontSize: 24,
    color: '#6B7280',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 24,
    marginRight: 12,
    color: '#9CA3AF',
  },
  searchInputNew: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  lostButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  foundButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextInactive: {
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryRowNew: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryScroll: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryBtn: {
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  categoryBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryBtnIcon: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBtnTextInactive: {
    color: '#374151',
  },
  categoryBtnTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#4F46E5',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleBtnTextInactive: {
    color: '#374151',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
  mapContainer: {
    height: 260,
    width: '100%',
    position: 'relative',
    marginBottom: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  mapButtonsContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 12,
  },
  mapBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  fabNew: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#FACC15',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  headerRowV2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerLeftV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircleV2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleV2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerRightV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtnV2: {
    marginRight: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  avatarCircleV2: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarRowV2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  searchIconCircleV2: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  searchInputV2: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  toggleRowV2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  toggleBtnV2: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleBtnInactiveV2: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  toggleBtnActiveV2: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  toggleBtnTextV2: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  toggleBtnTextInactiveV2: {
    color: '#6B7280',
  },
  toggleBtnTextActiveV2: {
    color: '#fff',
  },
  mapContainerV2: {
    height: 260,
    width: '100%',
    position: 'relative',
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  mapV2: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  mapButtonsContainerV2: {
    position: 'absolute',
    right: 18,
    top: 18,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 14,
    zIndex: 10,
  },
  mapBtnV2: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  mapBtnPlusV2: {
    backgroundColor: '#FACC15',
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  markerLost: {
    backgroundColor: '#FACC15',
  },
  markerFound: {
    backgroundColor: '#6366F1',
  },
  scrollContentV2: {
    paddingBottom: 120,
    backgroundColor: '#F9FAFB',
  },
  categoryScrollV2: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 10,
    marginTop: 0,
  },
  categoryRowV2: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  categoryBtnV2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryBtnActiveV2: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryBtnInactiveV2: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  categoryBtnIconV2: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtnTextV2: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryBtnTextActiveV2: {
    color: '#fff',
  },
  categoryBtnTextInactiveV2: {
    color: '#374151',
  },
});
