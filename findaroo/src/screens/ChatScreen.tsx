import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import { Message } from '../types';

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
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();
  const { messages, loading, error, sendMessage } = useChat(itemId, otherUserId);

  useEffect(() => {
    navigation.setOptions({
      title: `Chat with ${otherUserName}`,
    });
  }, [navigation, otherUserName]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const message = await sendMessage(newMessage, otherUserId);
    
    if (message) {
      setNewMessage('');
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = !previousMessage || 
      new Date(item.created_at).toDateString() !== new Date(previousMessage.created_at).toDateString();

    return (
      <View>
        {showDateSeparator && (
          <View className="items-center my-4">
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-sm text-gray-600">
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        )}
        
        <View className={`flex-row mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <View
            className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-500 rounded-br-md'
                : 'bg-gray-100 rounded-bl-md'
            }`}
          >
            <Text className={`text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
              {item.content}
            </Text>
            <Text className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <Loading message="Loading messages..." />;
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-red-600 text-center mb-4">
          Error loading messages: {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                Start the conversation
              </Text>
              <Text className="text-gray-600 text-center">
                Send a message to {otherUserName} about this item
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View className="border-t border-gray-200 p-4">
          <View className="flex-row items-end space-x-3">
            <TextInput
              className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 max-h-24"
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                newMessage.trim() && !sending ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white text-lg font-medium">
                {sending ? '⏳' : '➤'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
