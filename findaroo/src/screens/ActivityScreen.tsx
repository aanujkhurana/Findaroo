import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert, SafeAreaView, Platform, RefreshControl } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useItems } from '../hooks/useItems';
import { useChat } from '../hooks/useChat';
import { Item } from '../types';
import { supabase } from '../services/supabaseClient';

// Findaroo UI Style Guide Colors
const COLORS = {
  primary: '#3A8DFF',
  secondary: '#FFA930',
  success: '#33C48D',
  error: '#FF4C4C',
  neutral: '#F2F2F2',
  dark: '#2E2E2E',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#222222',
  muted: '#6b7280',
  border: '#e5e7eb',
  active: '#FFF4E6',
  matched: '#E8F5E8',
  resolved: '#E6F3FF',
  activeText: '#FFA930',
  matchedText: '#33C48D',
  resolvedText: '#3A8DFF',
};

const FILTERS = [
  { label: 'All Items', value: 'all', icon: 'list' },
  { label: 'Active', value: 'active', icon: 'clock' },
  { label: 'Matched', value: 'matched', icon: 'check-circle' },
  { label: 'Resolved', value: 'resolved', icon: 'check' },
];

// Helper function to get category icon with proper Findaroo styling
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
  return <Feather name={iconName as any} size={20} color={color} />;
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

// Helper function to get message count for an item
const getMessageCount = async (itemId: string, userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
};

// Helper function to get status display info with enhanced logic
const getStatusInfo = (item: Item, messageCount: number = 0) => {
  const isResolved = item.resolved;
  const hasMessages = messageCount > 0;

  if (isResolved || item.status === 'returned') {
    return {
      status: 'resolved',
      statusLabel: item.status === 'returned' ? 'Returned' : 'Resolved',
      statusColor: COLORS.resolved,
      statusTextColor: COLORS.resolvedText,
      icon: 'check',
    };
  } else if (hasMessages) {
    return {
      status: 'matched',
      statusLabel: 'Matched',
      statusColor: COLORS.matched,
      statusTextColor: COLORS.matchedText,
      icon: 'message-circle',
    };
  } else {
    return {
      status: 'active',
      statusLabel: 'Active',
      statusColor: COLORS.active,
      statusTextColor: COLORS.activeText,
      icon: 'clock',
    };
  }
};

export default function ActivityScreen() {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [messageCounts, setMessageCounts] = useState<{ [itemId: string]: number }>({});
  const navigation: any = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // Create stable filters object to prevent infinite re-renders
  const itemFilters = useMemo(() => ({
    userId: user?.id
  }), [user?.id]);

  // Only fetch user's items when we have a valid user ID
  const { items: userItems, loading: itemsLoading, error, deleteItem, updateItem, refetch } = useItems(
    user?.id ? itemFilters : {}
  );

  // Don't fetch items if user is not authenticated
  const shouldFetchItems = !!user?.id;



  // Fetch message counts for all items
  useEffect(() => {
    const fetchMessageCounts = async () => {
      if (!userItems || !user?.id) return;

      const counts: { [itemId: string]: number } = {};
      await Promise.all(
        userItems.map(async (item) => {
          const count = await getMessageCount(item.id, user.id);
          counts[item.id] = count;
        })
      );
      setMessageCounts(counts);
    };

    fetchMessageCounts();
  }, [userItems, user?.id]);

  // Transform items for display with enhanced information
  const allUserItems = useMemo(() => {
    if (!shouldFetchItems || !userItems) {
      return [];
    }

    return userItems.map(item => {
      const messageCount = messageCounts[item.id] || 0;
      const statusInfo = getStatusInfo(item, messageCount);
      const hasReward = item.reward_amount && item.reward_amount > 0;

      return {
        ...item, // Keep all original item properties
        // Add display properties with different names to avoid conflicts
        displayStatus: statusInfo.status,
        statusLabel: statusInfo.statusLabel,
        statusColor: statusInfo.statusColor,
        statusTextColor: statusInfo.statusTextColor,
        statusIcon: statusInfo.icon,
        icon: getCategoryIcon(item.category, COLORS.muted),
        type: item.status === 'lost' ? 'Lost' : 'Found',
        date: formatRelativeDate(item.created_at),
        desc: item.description,
        messageCount,
        hasReward,
        rewardAmount: item.reward_amount || 0,
        match: messageCount > 0,
        returned: item.status === 'returned' || item.resolved,
      };
    });
  }, [userItems, shouldFetchItems, messageCounts]);

  // Calculate compact statistics
  const stats = useMemo(() => {
    const totalPosts = allUserItems.length;
    const activeCount = allUserItems.filter(item => item.displayStatus === 'active').length;
    const matchedCount = allUserItems.filter(item => item.displayStatus === 'matched').length;
    const resolvedCount = allUserItems.filter(item => item.displayStatus === 'resolved').length;

    return [
      {
        label: 'Total',
        value: totalPosts,
        color: '#F0F4FF',
        textColor: COLORS.primary,
        icon: 'list'
      },
      {
        label: 'Active',
        value: activeCount,
        color: '#FFF8E6',
        textColor: '#E67E00',
        icon: 'clock'
      },
      {
        label: 'Matched',
        value: matchedCount,
        color: '#F0FDF4',
        textColor: COLORS.success,
        icon: 'message-circle'
      },
    ];
  }, [allUserItems]);

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      return allUserItems;
    }
    return allUserItems.filter(item => item.displayStatus === filter);
  }, [allUserItems, filter]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      // Refetch message counts
      if (userItems && user?.id) {
        const counts: { [itemId: string]: number } = {};
        await Promise.all(
          userItems.map(async (item) => {
            const count = await getMessageCount(item.id, user.id);
            counts[item.id] = count;
          })
        );
        setMessageCounts(counts);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.headerTitle, { marginTop: 16 }]}>Authenticating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Feather name="user-x" size={48} color={COLORS.muted} />
          <Text style={[styles.headerTitle, { marginTop: 16, textAlign: 'center' }]}>Not authenticated</Text>
          <Text style={[styles.statLabel, { textAlign: 'center', marginTop: 8 }]}>Please sign in to view your activity</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (itemsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.headerTitle, { marginTop: 16 }]}>Loading your activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Feather name="alert-circle" size={48} color={COLORS.muted} />
          <Text style={[styles.headerTitle, { marginTop: 16, textAlign: 'center' }]}>Error loading activity</Text>
          <Text style={[styles.statLabel, { textAlign: 'center', marginTop: 8 }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Activity</Text>
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="refresh-cw" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Compact Stats Row */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.color }]}>
              <Text style={[styles.statValue, { color: stat.textColor }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {/* Compact Filter Bar */}
        <View style={styles.filterContainer}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
              onPress={() => setFilter(f.value)}
            >
              <Text style={[styles.filterPillText, filter === f.value && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Enhanced Activity List */}
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={{
            paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 88 : 72) + 24
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Feather name="inbox" size={48} color={COLORS.muted} />
              </View>
              <Text style={styles.emptyStateTitle}>
                {filter === 'all' ? 'No items posted yet' : `No ${filter} items`}
              </Text>
              <Text style={styles.emptyStateText}>
                {filter === 'all'
                  ? 'Start by posting a lost or found item to help your community!'
                  : `You don't have any ${filter} items at the moment.`
                }
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate('Items')}
                >
                  <Feather name="plus" size={18} color="#fff" />
                  <Text style={styles.emptyActionText}>Post an Item</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.itemIcon}>{item.icon}</View>
            <View style={styles.itemContent}>
              <View style={styles.itemHeaderRow}>
                <View style={styles.itemTitleContainer}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.itemTypeContainer}>
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: item.status === 'lost' ? '#FFF0F0' : '#F0FFF0' }
                    ]}>
                      <Feather
                        name={item.status === 'lost' ? 'search' : 'check-circle'}
                        size={10}
                        color={item.status === 'lost' ? '#DC2626' : '#16A34A'}
                      />
                      <Text style={[
                        styles.typeText,
                        { color: item.status === 'lost' ? '#DC2626' : '#16A34A' }
                      ]}>
                        {item.type}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                  <Text style={[styles.statusBadgeText, { color: item.statusTextColor }]}>
                    {item.statusLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.itemMetaRow}>
                <View style={styles.itemMetaLeft}>
                  <Feather name="clock" size={12} color={COLORS.muted} />
                  <Text style={styles.itemMeta}>{item.date}</Text>
                  {item.location_name && (
                    <>
                      <Feather name="map-pin" size={12} color={COLORS.muted} style={{ marginLeft: 8 }} />
                      <Text style={styles.itemLocation} numberOfLines={1}>{item.location_name}</Text>
                    </>
                  )}
                </View>
                {item.hasReward && (
                  <View style={styles.rewardBadge}>
                    <Feather name="dollar-sign" size={10} color="#B45309" />
                    <Text style={styles.rewardText}>{item.rewardAmount}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>

              <View style={styles.itemFooterRow}>
                <View style={styles.itemFooterLeft}>
                  {item.messageCount > 0 && (
                    <View style={styles.messageIndicator}>
                      <Feather name="message-circle" size={12} color={COLORS.success} />
                      <Text style={[styles.itemFooterText, { color: COLORS.success }]}>
                        {item.messageCount}
                      </Text>
                    </View>
                  )}
                  {item.returned && (
                    <View style={styles.returnedIndicator}>
                      <Feather name="check" size={12} color={COLORS.primary} />
                      <Text style={[styles.itemFooterText, { color: COLORS.primary }]}>Returned</Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemFooterRight}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                    style={styles.actionButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="edit-2" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item);
                    }}
                    style={[styles.actionButton, styles.deleteButton]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 8 : 18,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  headerTitle: { fontWeight: 'bold', fontSize: 20, color: COLORS.text },

  // Compact Stats Styles
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statValue: { fontWeight: 'bold', fontSize: 16 },
  statLabel: { color: COLORS.muted, fontSize: 11, textAlign: 'center', fontWeight: '500', marginTop: 2 },
  // Compact Filter Styles
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 16,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  // Compact Item Card Styles
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 2,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemMeta: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  itemLocation: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  rewardText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  itemDesc: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  messageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  returnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  itemFooterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(58, 141, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
  },
  // Enhanced Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});