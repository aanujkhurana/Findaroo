import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { karmaService } from '../services/karmaService';
import { KarmaEvent } from '../types';
import { Loading } from '../components/Loading';

interface KarmaHistoryScreenProps {
  navigation: any;
}

interface KarmaEventWithItem extends KarmaEvent {
  items?: {
    id: string;
    title: string;
    status: string;
  };
}

export const KarmaHistoryScreen: React.FC<KarmaHistoryScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [karmaEvents, setKarmaEvents] = useState<KarmaEventWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [karmaStats, setKarmaStats] = useState<any>(null);

  const fetchKarmaHistory = async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [historyResult, statsResult] = await Promise.all([
        karmaService.getUserKarmaHistory(user.id),
        karmaService.getUserKarmaStats(user.id)
      ]);

      if (historyResult.success && historyResult.karmaEvents) {
        setKarmaEvents(historyResult.karmaEvents as KarmaEventWithItem[]);
      } else {
        console.error('Error fetching karma history:', historyResult.error);
      }

      if (statsResult.success && statsResult.stats) {
        setKarmaStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error fetching karma data:', error);
      Alert.alert('Error', 'Failed to load karma history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKarmaHistory();
  }, [user?.id]);

  const onRefresh = () => {
    fetchKarmaHistory(true);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'return_success':
        return { name: 'check-circle', color: '#10B981' };
      case 'send_tip':
        return { name: 'gift', color: '#F59E0B' };
      case 'ghost_request':
        return { name: 'user-x', color: '#EF4444' };
      case 'keep_item':
        return { name: 'archive', color: '#EF4444' };
      case 'get_flagged':
        return { name: 'flag', color: '#EF4444' };
      case 'report_spam':
        return { name: 'shield', color: '#10B981' };
      case 'item_posted':
        return { name: 'plus-circle', color: '#3B82F6' };
      case 'first_message':
        return { name: 'message-circle', color: '#8B5CF6' };
      default:
        return { name: 'star', color: '#6B7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderKarmaEvent = ({ item }: { item: KarmaEventWithItem }) => {
    const actionIcon = getActionIcon(item.action);
    const isPositive = item.points > 0;

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${actionIcon.color}15` }]}>
            <Feather name={actionIcon.name as any} size={20} color={actionIcon.color} />
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>
              {karmaService.getKarmaActionDescription(item.action)}
            </Text>
            {item.items && (
              <Text style={styles.eventSubtitle} numberOfLines={1}>
                {item.items.title}
              </Text>
            )}
            <Text style={styles.eventDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={[
              styles.pointsText,
              { color: isPositive ? '#10B981' : '#EF4444' }
            ]}>
              {isPositive ? '+' : ''}{item.points}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStatsCard = () => {
    if (!karmaStats) return null;

    const karmaLevel = karmaService.getKarmaLevel(karmaStats.totalPoints);

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View style={[styles.levelIconContainer, { backgroundColor: `${karmaLevel.color}15` }]}>
            <Feather name={karmaLevel.icon as any} size={24} color={karmaLevel.color} />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{karmaLevel.level}</Text>
            <Text style={styles.levelDescription}>{karmaLevel.description}</Text>
          </View>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{karmaStats.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{karmaStats.returnsCompleted}</Text>
            <Text style={styles.statLabel}>Returns</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{karmaStats.tipsSent}</Text>
            <Text style={styles.statLabel}>Tips Sent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{karmaStats.positiveEvents}</Text>
            <Text style={styles.statLabel}>Good Deeds</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karma History</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={karmaEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderKarmaEvent}
        ListHeaderComponent={renderStatsCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="star" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Karma History</Text>
            <Text style={styles.emptySubtitle}>
              Start helping others to earn karma points!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerRight: {
    width: 40,
  },
  listContainer: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pointsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
