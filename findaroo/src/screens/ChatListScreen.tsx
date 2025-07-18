import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import { ChatThread } from '../types';

interface ChatListScreenProps {
  navigation: any;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const { session } = useAuth();
  const { threads, loading, error, refetchThreads, getUnreadMessagesCount } = useChat();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchThreads();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherUser = (thread: ChatThread) => {
    if (!session?.user) return null;
    return thread.participant_1?.id === session.user.id 
      ? thread.participant_2 
      : thread.participant_1;
  };

  const renderChatItem = ({ item }: { item: ChatThread }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) {
      console.log('[ChatListScreen] No other user found for thread:', item);
      return null;
    }

    const threadId = `${item.item_id}-${otherUser.id}`;
    const unreadCount = getUnreadMessagesCount(threadId);

    const handlePress = () => {
      console.log('[ChatListScreen] Navigating to chat:', {
        itemId: item.item_id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.full_name,
      });

      navigation.navigate('Chat', {
        itemId: item.item_id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.full_name,
      });
    };

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={handlePress}
      >
        <View style={styles.avatarContainer}>
          {otherUser.profile_pic ? (
            <Image source={{ uri: otherUser.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>{otherUser.full_name}</Text>
            {item.last_message && (
              <Text style={styles.timestamp}>
                {formatTime(item.last_message.sent_at)}
              </Text>
            )}
          </View>
          
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.item?.title || 'Unknown Item'}
          </Text>
          
          {item.last_message && (
            <Text style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadMessage
            ]} numberOfLines={2}>
              {item.last_message.message}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <Loading message="Loading chats..." />;
  }

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="chat" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Sign in to view chats</Text>
          <Text style={styles.emptySubtitle}>
            You need to be signed in to see your conversations
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.headerModern}>
          <Text style={styles.headerTitleModern}>Messages</Text>
          <MaterialIcons name="chat-bubble-outline" size={28} color="#4f46e5" style={styles.headerIconModern} />
        </View>
        <View style={styles.headerDivider} />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {threads.length === 0 && !loading ? (
        <View style={styles.emptyStateModern}>
          <MaterialIcons name="chat-bubble-outline" size={72} color="#e0e7ff" />
          <Text style={styles.emptyTitleModern}>No conversations yet</Text>
          <Text style={styles.emptySubtitleModern}>
            Start a conversation by messaging someone about their lost or found item
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainerModern}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // lighter background
  },
  headerWrapper: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleModern: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerIconModern: {
    marginLeft: 8,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#e0e7ff',
    marginHorizontal: 20,
    marginBottom: 2,
  },
  listContainerModern: {
    flexGrow: 1,
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  itemTitle: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#1e293b',
    fontWeight: '700',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateModern: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitleModern: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6366f1',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitleModern: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
});
