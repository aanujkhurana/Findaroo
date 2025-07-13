import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useItems } from '../hooks/useItems';
import { Item } from '../types';

const COLORS = {
  background: '#f8fafc',
  card: '#fff',
  primary: '#2563eb',
  accent: '#fbbf24',
  text: '#222',
  muted: '#6b7280',
  border: '#e5e7eb',
  active: '#fee2e2',
  matched: '#dcfce7',
  resolved: '#e0e7ff',
  activeText: '#fb7185',
  matchedText: '#22c55e',
  resolvedText: '#6366f1',
};

const FILTERS = [
  { label: 'All Items', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Matched', value: 'matched' },
  { label: 'Resolved', value: 'resolved' },
];

// Helper function to get category icon
const getCategoryIcon = (category: string, color: string = COLORS.primary) => {
  const iconMap: { [key: string]: string } = {
    electronics: 'smartphone',
    phone: 'smartphone',
    keys: 'key',
    wallet: 'credit-card',
    bags: 'briefcase',
    bag: 'briefcase',
    clothing: 'shopping-bag',
    accessories: 'eye',
    jewelry: 'star',
    documents: 'file-text',
    pets: 'heart',
    pet: 'heart',
    sports: 'activity',
    other: 'package',
  };

  const iconName = iconMap[category?.toLowerCase()] || 'package';
  return <Feather name={iconName as any} size={22} color={color} />;
};

// Helper function to format date to relative time
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 14) {
    return '1 week ago';
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  }
};

// Helper function to get status display info
const getStatusInfo = (item: Item) => {
  const hasMessages = false; // TODO: Add message count logic when available
  const isResolved = item.resolved;

  if (isResolved) {
    return {
      status: 'resolved',
      statusLabel: 'Resolved',
      statusColor: COLORS.resolved,
      statusTextColor: COLORS.resolvedText,
    };
  } else if (item.status === 'returned') {
    return {
      status: 'resolved',
      statusLabel: 'Returned',
      statusColor: COLORS.resolved,
      statusTextColor: COLORS.resolvedText,
    };
  } else if (hasMessages) {
    return {
      status: 'matched',
      statusLabel: 'Matched',
      statusColor: COLORS.matched,
      statusTextColor: COLORS.matchedText,
    };
  } else {
    return {
      status: 'active',
      statusLabel: 'Active',
      statusColor: COLORS.active,
      statusTextColor: COLORS.activeText,
    };
  }
};

export default function ActivityScreen() {
  const [filter, setFilter] = useState('all');
  const navigation: any = useNavigation();
  const { user, loading: authLoading } = useAuth();

  // Create stable filters object to prevent infinite re-renders
  const itemFilters = useMemo(() => ({
    userId: user?.id
  }), [user?.id]);

  // Only fetch user's items when we have a valid user ID
  const { items: userItems, loading: itemsLoading, error, deleteItem, updateItem } = useItems(
    user?.id ? itemFilters : {}
  );

  // Don't fetch items if user is not authenticated
  const shouldFetchItems = !!user?.id;



  // Transform items for display
  const allUserItems = useMemo(() => {
    if (!shouldFetchItems || !userItems) {
      return [];
    }

    return userItems.map(item => {
      const statusInfo = getStatusInfo(item);
      return {
        ...item, // Keep all original item properties
        // Add display properties with different names to avoid conflicts
        displayStatus: statusInfo.status,
        statusLabel: statusInfo.statusLabel,
        statusColor: statusInfo.statusColor,
        statusTextColor: statusInfo.statusTextColor,
        icon: getCategoryIcon(item.category, statusInfo.statusTextColor),
        type: item.status === 'lost' ? 'Lost' : 'Found',
        date: formatRelativeDate(item.created_at),
        desc: item.description,
        views: 0, // TODO: Add view tracking when available
        saves: 0, // TODO: Add save tracking when available
        match: false, // TODO: Add message/match logic when available
        returned: item.status === 'returned' || item.resolved,
      };
    });
  }, [userItems, shouldFetchItems]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPosts = allUserItems.length;
    const matchedCount = allUserItems.filter(item => item.match).length;
    const resolvedCount = allUserItems.filter(item => item.returned).length;

    return [
      { label: 'Total Posts', value: totalPosts, color: '#e0edff', textColor: COLORS.primary },
      { label: 'Matched', value: matchedCount, color: '#e7fbe7', textColor: COLORS.matchedText },
      { label: 'Resolved', value: resolvedCount, color: '#fbe7e7', textColor: COLORS.accent },
    ];
  }, [allUserItems]);

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      return allUserItems;
    }
    return allUserItems.filter(item => item.displayStatus === filter);
  }, [allUserItems, filter]);

  // Handle edit item
  const handleEditItem = (originalItem: Item) => {
    // Clean the item data to remove non-serializable properties
    const cleanItemData = {
      id: originalItem.id,
      title: originalItem.title,
      description: originalItem.description,
      category: originalItem.category,
      status: originalItem.status,
      location_name: originalItem.location_name,
      reward_amount: originalItem.reward_amount,
      image: originalItem.image,
      resolved: originalItem.resolved,
      created_at: originalItem.created_at,
      user_id: originalItem.user_id,
      // Add any other needed properties but exclude display-only ones like icon
    };

    // Use the original database status, not the transformed display status
    if (originalItem.status === 'lost') {
      navigation.navigate('CreateLostItem', {
        editMode: true,
        itemData: cleanItemData
      });
    } else if (originalItem.status === 'found') {
      navigation.navigate('CreateFoundItem', {
        editMode: true,
        itemData: cleanItemData
      });
    }
  };

  // Handle delete item
  const handleDeleteItem = (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteItem(item.id);
            if (success) {
              Alert.alert('Success', 'Item deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Combined loading state - wait for both auth and items
  const loading = authLoading || (shouldFetchItems && itemsLoading);

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.headerTitle, { marginTop: 16 }]}>Authenticating...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="user-x" size={48} color={COLORS.muted} />
        <Text style={[styles.headerTitle, { marginTop: 16, textAlign: 'center' }]}>Not authenticated</Text>
        <Text style={[styles.statLabel, { textAlign: 'center', marginTop: 8 }]}>Please sign in to view your activity</Text>
      </View>
    );
  }

  if (itemsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.headerTitle, { marginTop: 16 }]}>Loading your activity...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="alert-circle" size={48} color={COLORS.muted} />
        <Text style={[styles.headerTitle, { marginTop: 16, textAlign: 'center' }]}>Error loading activity</Text>
        <Text style={[styles.statLabel, { textAlign: 'center', marginTop: 8 }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Feather name="arrow-left" size={22} color={COLORS.text} />
        <Text style={styles.headerTitle}>My Activity</Text>
        <Feather name="more-vertical" size={22} color={COLORS.text} />
      </View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.color }] }>
            <Text style={[styles.statValue, { color: stat.textColor }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterPillText, filter === f.value && styles.filterPillTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Activity List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={COLORS.muted} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'all' ? 'No items posted yet' : `No ${filter} items`}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Start by posting a lost or found item to help your community!'
                : `You don't have any ${filter} items at the moment.`
              }
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemIcon}>{item.icon}</View>
            <View style={{ flex: 1 }}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor }] }>
                  <Text style={[styles.statusBadgeText, { color: item.statusTextColor }]}>{item.statusLabel}</Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>{item.type} • {item.date}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
              <View style={styles.itemFooterRow}>
                <View style={styles.itemFooterLeft}>
                  <Feather name="eye" size={15} color={COLORS.muted} />
                  <Text style={styles.itemFooterText}>{item.views} views</Text>
                  {item.match && (
                    <>
                      <Feather name="check-circle" size={15} color={COLORS.matchedText} style={{ marginLeft: 8 }} />
                      <Text style={[styles.itemFooterText, { color: COLORS.matchedText }]}>Match found</Text>
                    </>
                  )}
                  {item.returned && (
                    <>
                      <Feather name="check" size={15} color={COLORS.resolvedText} style={{ marginLeft: 8 }} />
                      <Text style={[styles.itemFooterText, { color: COLORS.resolvedText }]}>Returned</Text>
                    </>
                  )}
                </View>
                <View style={styles.itemFooterRight}>
                  <TouchableOpacity
                    onPress={() => handleEditItem(item)}
                    style={styles.actionButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="edit-2" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item)}
                    style={styles.actionButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  headerTitle: { fontWeight: 'bold', fontSize: 20, color: COLORS.text },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  statValue: { fontWeight: 'bold', fontSize: 20 },
  statLabel: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 10,
  },
  filterPill: {
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: { fontWeight: 'bold', fontSize: 15, color: COLORS.text, flex: 1 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  itemMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  itemDesc: { color: COLORS.text, fontSize: 13, marginTop: 2 },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  itemFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemFooterText: {
    color: COLORS.muted,
    fontSize: 12,
    marginLeft: 4,
  },
  itemFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});