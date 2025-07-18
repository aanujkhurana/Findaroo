import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import { Message } from '../types';
import { testDatabaseConnection, testRealTimeConnection } from '../utils/testDatabase';
import { useItems } from '../hooks/useItems';
import { supabase } from '../services/supabaseClient';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      itemId: string;
      otherUserId: string;
      otherUserName: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { itemId, otherUserId, otherUserName } = route.params;

  console.log('[ChatScreen] Initialized with params:', { itemId, otherUserId, otherUserName });

  const { session } = useAuth();
  const {
    messages,
    loading,
    error,
    sendMessage,
    markAllAsRead,
    isMessageRead
  } = useChat(itemId, otherUserId);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { markAsResolved, updateItem } = useItems();
  const [item, setItem] = useState<any>(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      // Hide the default navigation header
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchItem = async () => {
      setItemLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();
      if (!error) setItem(data);
      setItemLoading(false);
    };
    fetchItem();
  }, [itemId]);

  const handleResolve = async () => {
    if (!item) return;
    setResolving(true);
    let newStatus = item.status;
    if (item.status === 'lost') {
      newStatus = 'returned';
    } else if (item.status === 'found') {
      newStatus = 'claimed';
    }
    const updated = await updateItem(item.id, { resolved: true, status: newStatus });
    if (updated) {
      setItem({ ...item, resolved: true, status: newStatus });
      Alert.alert('Success', `Item marked as resolved (${newStatus}).`);
    } else {
      Alert.alert('Error', 'Failed to mark item as resolved.');
    }
    setResolving(false);
  };

  const scrollToBottom = React.useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const runTests = async () => {
      await testDatabaseConnection();
      await testRealTimeConnection();
    };
    runTests();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', markAllAsRead);
    return unsubscribe;
  }, [navigation, markAllAsRead]);

  const handleSendMessage = React.useCallback(async () => {
    if (!messageText.trim() || sending) return;

    console.log('[ChatScreen] Sending message:', messageText);
    setSending(true);
    try {
      const result = await sendMessage(messageText, otherUserId);
      console.log('[ChatScreen] Send message result:', result);
      if (result) {
        setMessageText('');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [messageText, sending, sendMessage, otherUserId]);

  const formatTime = React.useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = React.useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  const renderMessage = React.useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === session?.user?.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = !previousMessage ||
      new Date(item.sent_at).toDateString() !== new Date(previousMessage.sent_at).toDateString();

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.sent_at)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[
                styles.timeText,
                isMyMessage ? styles.myTimeText : styles.otherTimeText
              ]}>
                {formatTime(item.sent_at)}
              </Text>
              {isMyMessage && (
                <View style={styles.readReceiptContainer}>
                  <MaterialIcons
                    name={isMessageRead(item) ? "done-all" : "done"}
                    size={14}
                    color={isMessageRead(item) ? "#3A8DFF" : "#9CA3AF"}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }, [session?.user?.id, messages, formatDate, formatTime, isMessageRead]);

  if (loading) {
    return <Loading message="Loading messages..." />;
  }

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>You need to be signed in to chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{otherUserName}</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for symmetry */}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {/* Call to Action: Mark as Resolved */}
        {!itemLoading && item && !item.resolved && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#e0e7ff', alignItems: 'center' }}>
            <Text style={{ color: '#3730a3', marginBottom: 8, fontWeight: '600' }}>Is this item resolved?</Text>
            <TouchableOpacity
              style={{
                backgroundColor: resolving ? '#9ca3af' : '#4f46e5',
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 20,
              }}
              onPress={() => {
                Alert.alert(
                  'Confirm',
                  'Are you sure you want to mark this item as resolved?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', onPress: handleResolve },
                  ]
                );
              }}
              disabled={resolving}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{resolving ? 'Marking...' : 'Mark as Resolved'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => `message-${item.id}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <MaterialIcons name="hourglass-empty" size={24} color="#fff" />
            ) : (
              <MaterialIcons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 8,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1e293b',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  myTimeText: {
    color: '#fff',
  },
  otherTimeText: {
    color: '#64748b',
  },
  readReceiptContainer: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});
