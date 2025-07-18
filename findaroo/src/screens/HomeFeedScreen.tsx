import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '../hooks/useItems';
import { ItemCard } from '../components/ItemCard';
import { Loading } from '../components/Loading';
import { Category } from '../types';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { Modal as RNModal } from 'react-native';
import { LocationFilterModal } from '../components/LocationFilterModal';

// Findaroo Official Color Palette
const COLORS = {
  background: '#fff',
  primary: '#000',         // Black accent
  secondary: '#FFA930',    // Official Findaroo orange
  success: '#33C48D',      // Success green
  error: '#FF4C4C',        // Error red
  text: '#2E2E2E',         // Dark gray for text
  muted: '#6b7280',
  border: '#e5e7eb',
  card: '#F2F2F2',         // Neutral gray for cards
};

const CATEGORIES = [
  {
    value: undefined,
    label: 'All',
    icon: 'grid',
    activeColor: '#fff'
  },
  {
    value: 'lost',
    label: 'Lost',
    icon: 'alert-circle',
    activeColor: COLORS.error // Red for lost
  },
  {
    value: 'found',
    label: 'Found',
    icon: 'check-circle',
    activeColor: '#3A8DFF' // Blue for found
  },
  // Add more categories as needed
];

const CATEGORY_OPTIONS: { value: Category | undefined; label: string }[] = [
  { value: undefined, label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'documents', label: 'Documents' },
  { value: 'keys', label: 'Keys' },
  { value: 'bags', label: 'Bags' },
  { value: 'pets', label: 'Pets' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

const DISTANCE_OPTIONS = [
  { value: undefined, label: 'Any Distance', icon: <Feather name="globe" size={18} color={COLORS.muted} /> },
  { value: 1, label: 'Within 1km', icon: <Feather name="user" size={18} color={COLORS.muted} /> },
  { value: 5, label: 'Within 5km', icon: <Feather name="zap" size={18} color={COLORS.muted} /> },
  { value: 10, label: 'Within 10km', icon: <Feather name="truck" size={18} color={COLORS.muted} /> },
  { value: 25, label: 'Within 25km', icon: <Feather name="navigation" size={18} color={COLORS.muted} /> },
  { value: 50, label: 'Within 50km', icon: <Feather name="navigation-2" size={18} color={COLORS.muted} /> },
];

const SEARCH_SUGGESTIONS = [
  'iPhone', 'wallet', 'keys', 'backpack', 'laptop', 'sunglasses',
  'watch', 'headphones', 'phone', 'bag', 'jacket', 'book',
  'umbrella', 'charger', 'earbuds', 'glasses', 'ring', 'necklace'
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



export const HomeFeedScreen = ({ navigation }: any) => {
  const [status, setStatus] = useState<'lost' | 'found' | undefined>(undefined);
  const [searchInput, setSearchInput] = useState(''); // Input text
  const [search, setSearch] = useState(''); // Actual search query
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  // Change category state to array
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<Category[]>([]);
  // Distance filtering
  const [maxDistance, setMaxDistance] = useState<number | undefined>(undefined);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [distanceModalVisible, setDistanceModalVisible] = useState(false);
  const [locationFilterModalVisible, setLocationFilterModalVisible] = useState(false);

  const filters = useMemo(() => ({
    status,
    categories,
    search: search.trim() || undefined,
    maxDistance,
    sortByDistance,
  }), [status, categories, search, maxDistance, sortByDistance]);

  const { items, loading, error, userLocation, refetch } = useItems(filters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    setSearch(searchInput.trim());
    setShowSuggestions(false);
  }, [searchInput]);

  // Handle search input change
  const handleSearchInputChange = useCallback((text: string) => {
    setSearchInput(text);
    setShowSuggestions(text.length > 0);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setSearchInput(suggestion);
    setSearch(suggestion);
    setShowSuggestions(false);
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!searchInput.trim()) return SEARCH_SUGGESTIONS.slice(0, 6);
    return SEARCH_SUGGESTIONS.filter(suggestion =>
      suggestion.toLowerCase().includes(searchInput.toLowerCase())
    ).slice(0, 6);
  }, [searchInput]);

  // Update filtering logic for items
  const filteredItems = useMemo(() => {
    if (!categories.length) return items;
    return items.filter(item => categories.includes(item.category as Category));
  }, [items, categories]);

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
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={COLORS.muted} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => setShowSuggestions(searchInput.length > 0)}
            placeholder="Search lost & found items…"
            placeholderTextColor={COLORS.muted}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchInput('');
                setSearch('');
                setShowSuggestions(false);
              }}
              style={styles.clearButton}
            >
              <Feather name="x" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}
            >
              {filteredSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionPill}
                  onPress={() => handleSuggestionSelect(suggestion)}
                >
                  <Feather name="search" size={14} color={COLORS.muted} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Pill Filter Bar (no scroll, 3 pills + filter icon) */}
      <View style={styles.filterBarNoScroll}>
        {CATEGORIES.map((cat) => {
          const isActive = status === cat.value || (!status && cat.value === undefined);
          const activeStyle = isActive ? {
            backgroundColor: cat.value === 'lost' ? COLORS.error :
                           cat.value === 'found' ? '#3A8DFF' :
                           COLORS.primary,
            borderColor: cat.value === 'lost' ? COLORS.error :
                        cat.value === 'found' ? '#3A8DFF' :
                        COLORS.primary,
          } : {};

          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.filterPill, isActive && activeStyle]}
              onPress={() => setStatus(cat.value as 'lost' | 'found' | undefined)}
            >
              <Feather
                name={cat.icon as any}
                size={18}
                color={isActive ? '#fff' : COLORS.primary}
              />
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ flex: 1 }} />

        {/* Distance Filter Button */}
        <TouchableOpacity
          style={[styles.filterIconBtn, maxDistance ? styles.filterIconBtnActive : null]}
          onPress={() => setLocationFilterModalVisible(true)}
        >
          <Feather name="map-pin" size={18} color={maxDistance ? '#fff' : COLORS.primary} />
          {maxDistance && (
            <Text style={styles.filterBadgeText}>{maxDistance}km</Text>
          )}
        </TouchableOpacity>

        {/* Category Filter Button */}
        <TouchableOpacity
          style={[styles.filterIconBtn, categories.length > 0 && styles.filterIconBtnActive]}
          onPress={() => {
            setPendingCategories(categories);
            setCategoryModalVisible(true);
          }}
        >
          <Feather name="filter" size={18} color={categories.length > 0 ? '#fff' : COLORS.primary} />
          {categories.length > 0 && (
            <Text style={styles.filterBadgeText}>{categories.length}</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Category Filter Modal */}
      <RNModal
        visible={categoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <SafeAreaView style={styles.categoryModalContainer}>
          {/* Header */}
          <View style={styles.categoryModalHeader}>
            <TouchableOpacity
              onPress={() => setCategoryModalVisible(false)}
              style={styles.categoryModalCloseButton}
            >
              <Feather name="x" size={18} color={COLORS.muted} />
            </TouchableOpacity>
            <Text style={styles.categoryModalTitle}>Select Categories</Text>
            <TouchableOpacity
              onPress={() => {
                setCategories(pendingCategories);
                setCategoryModalVisible(false);
              }}
              style={styles.categoryModalApplyButton}
            >
              <Text style={styles.categoryModalApplyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Categories List */}
          <ScrollView style={styles.categoryModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.categoryModalSection}>
              <Text style={styles.categoryModalSectionTitle}>Choose item categories to filter by:</Text>

              {CATEGORY_OPTIONS.filter(opt => opt.value !== undefined).map(opt => {
                const selected = pendingCategories.includes(opt.value as Category);
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.categoryModalOption, selected && styles.categoryModalOptionSelected]}
                    onPress={() => {
                      setPendingCategories(prev =>
                        selected
                          ? prev.filter(c => c !== opt.value)
                          : [...prev, opt.value as Category]
                      );
                    }}
                  >
                    <Feather
                      name={selected ? "check-square" : "square"}
                      size={18}
                      color={selected ? COLORS.primary : COLORS.muted}
                    />
                    <Text style={[styles.categoryModalOptionText, selected && styles.categoryModalOptionTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Clear All Button */}
            <View style={styles.categoryModalActions}>
              <TouchableOpacity
                style={styles.categoryModalClearButton}
                onPress={() => setPendingCategories([])}
              >
                <Feather name="x-circle" size={18} color={COLORS.muted} />
                <Text style={styles.categoryModalClearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </RNModal>

      {/* Distance Filter Modal */}
      <RNModal
        visible={distanceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDistanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Distance</Text>

            {/* Sort by Distance Toggle */}
            <TouchableOpacity
              style={[styles.modalOption, sortByDistance && styles.modalOptionSelected]}
              onPress={() => setSortByDistance(!sortByDistance)}
            >
              <Text style={[styles.modalOptionText, sortByDistance && styles.modalOptionTextSelected]}>
                {sortByDistance ? '✓ ' : ''}Sort by Distance (Closest First)
              </Text>
            </TouchableOpacity>

            <View style={styles.modalSeparator} />

            {/* Distance Options */}
            {DISTANCE_OPTIONS.map(option => {
              const selected = maxDistance === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => setMaxDistance(option.value)}
                >
                  <View style={styles.modalOptionIcon}>{option.icon}</View>
                  <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                    {selected ? '✓ ' : ''}{option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setDistanceModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>

      {/* Location Filter Modal */}
      <LocationFilterModal
        visible={locationFilterModalVisible}
        onClose={() => setLocationFilterModalVisible(false)}
        currentMaxDistance={maxDistance}
        currentSortByDistance={sortByDistance}
        onApplyFilters={(distance, sortByDistance) => {
          setMaxDistance(distance);
          setSortByDistance(sortByDistance);
          setLocationFilterModalVisible(false);
        }}
        userLocation={userLocation}
      />

      {/* Map Preview Row (expandable) */}
      <TouchableOpacity onPress={() => setMapExpanded((prev) => !prev)} activeOpacity={0.85}>
        <View style={[styles.mapPreviewRow, mapExpanded && styles.mapExpandedRow]}>
          <MapView
            style={mapExpanded ? styles.mapExpanded : styles.mapPreview}
            initialRegion={{
              latitude: -33.8688,
              longitude: 151.2093,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            pointerEvents={mapExpanded ? 'auto' : 'none'}
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
                    <MaterialIcons name={item.status === 'lost' ? 'report-problem' : 'check-circle'} size={mapExpanded ? 20 : 16} color={'#fff'} />
                  </View>
                </Marker>
              ) : null;
            })}
          </MapView>
          <TouchableOpacity style={styles.mapExpandBtn} onPress={() => setMapExpanded((prev) => !prev)}>
            <Feather name={mapExpanded ? 'minimize-2' : 'maximize-2'} size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Items List - Minimal Card Design */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridItemWrapper}>
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
              userLocation={userLocation}
              showDistance={true}
              cardStyle={styles.gridCard}
              imageStyle={item.image ? styles.gridImage : styles.gridImageSmall}
            />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 8, paddingHorizontal: 8 }}
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
  searchContainer: {
    marginHorizontal: 18,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 4,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 6,
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
  filterBarNoScroll: {
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
  filterIconBtn: {
    marginLeft: 8,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterIconBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterIconBtnSmall: {
    marginLeft: 8,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
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
    height: 70,
  },
  mapExpanded: {
    width: '100%',
    height: Dimensions.get('window').height * 0.5, // Half the screen height
    borderRadius: 14,
  },
  mapExpandedRow: {
    height: Dimensions.get('window').height * 0.5, // Half the screen height
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
  markerLost: { backgroundColor: COLORS.error },
  markerFound: { backgroundColor: COLORS.success },
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

  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyText: { color: COLORS.muted, fontSize: 16, marginTop: 8, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  errorText: { color: COLORS.error, fontSize: 16, marginBottom: 12 },

  // Distance Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  modalOptionIcon: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Category Modal styles
  categoryModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryModalCloseButton: {
    padding: 4,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryModalApplyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryModalApplyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryModalContent: {
    flex: 1,
  },
  categoryModalSection: {
    padding: 20,
  },
  categoryModalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  categoryModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  categoryModalOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  categoryModalOptionText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  categoryModalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoryModalActions: {
    padding: 20,
    paddingTop: 0,
  },
  categoryModalClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryModalClearButtonText: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 0,
  },
  gridItemWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  gridCard: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 0,
    padding: 0,
    minHeight: 220,
    minWidth: 0,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    resizeMode: 'cover',
    backgroundColor: COLORS.card,
  },
  gridImageSmall: {
    width: '100%',
    height: 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    resizeMode: 'cover',
    backgroundColor: COLORS.card,
  },
});
