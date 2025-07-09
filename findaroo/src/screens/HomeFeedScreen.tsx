import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '../hooks/useItems';
import { ItemCard } from '../components/ItemCard';
import { Loading } from '../components/Loading';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Category } from '../types';

interface HomeFeedScreenProps {
  navigation: any;
}

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'accessories', label: 'Accessories', icon: '👜' },
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'keys', label: 'Keys', icon: '🔑' },
  { value: 'bags', label: 'Bags', icon: '🎒' },
  { value: 'pets', label: 'Pets', icon: '🐕' },
  { value: 'jewelry', label: 'Jewelry', icon: '💍' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const HomeFeedScreen: React.FC<HomeFeedScreenProps> = ({ navigation }) => {
  const [status, setStatus] = useState<'lost' | 'found' | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { items, loading, error, refetch } = useItems({
    status,
    category,
    search: search.trim() || undefined,
  });

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Findaroo</Text>
        <Text style={styles.headerSubtitle}>Help reunite lost items</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search items..."
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => handleStatusFilter('lost')}
            style={[
              styles.filterButton,
              status === 'lost' ? styles.lostButtonActive : styles.filterButtonInactive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              status === 'lost' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
            ]}>
              Lost
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleStatusFilter('found')}
            style={[
              styles.filterButton,
              status === 'found' ? styles.foundButtonActive : styles.filterButtonInactive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              status === 'found' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
            ]}>
              Found
            </Text>
          </TouchableOpacity>

          {(status || category || search) && (
            <TouchableOpacity
              onPress={clearFilters}
              style={[styles.filterButton, styles.clearButton]}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => handleCategoryFilter(cat.value)}
                style={[
                  styles.categoryButton,
                  category === cat.value ? styles.categoryButtonActive : styles.categoryButtonInactive
                ]}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryButtonText,
                  category === cat.value ? styles.categoryButtonTextActive : styles.categoryButtonTextInactive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>
              No items found
            </Text>
            <Text style={styles.emptyStateMessage}>
              {search || status || category 
                ? 'Try adjusting your filters'
                : 'Be the first to post an item!'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateItem')}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  lostButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  foundButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
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
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryButtonInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  categoryButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextInactive: {
    color: '#374151',
  },
  categoryButtonTextActive: {
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
    color: '#6b7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#2563eb',
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
});
