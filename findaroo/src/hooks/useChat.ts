import { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { Message, ChatThread } from '../types';

// Sound playing function
const playMessageSound = async () => {
  try {
    // Set audio mode for better sound playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Use Expo's notification sound
    await Notifications.presentNotificationAsync({
      content: {
        sound: 'default',
        priority: 'high',
      },
      trigger: null,
    });
  } catch (error) {
    console.log('[useChat] Sound playback failed:', error.message);
  }
};

export const useChat = (itemId?: string, otherUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user && isMounted) {
        currentUserIdRef.current = currentUser.data.user.id;
        console.log(`[useChat] Initialized with user: ${currentUser.data.user.id}`);
      }

      if (itemId && otherUserId && isMounted) {
        console.log(`[useChat] Setting up chat for item: ${itemId}, other user: ${otherUserId}`);
        await fetchMessages();

        // Wait a bit longer to ensure everything is ready
        setTimeout(() => {
          if (isMounted) {
            subscribeToMessages();
            subscribeToReadReceipts();
          }
        }, 500);
      } else if (isMounted) {
        await fetchThreads();
        setTimeout(() => {
          if (isMounted) {
            subscribeToAllMessages();
          }
        }, 500);
      }
    };

    initializeChat();

    // Cleanup subscriptions on unmount
    return () => {
      isMounted = false;
      console.log('[useChat] Cleaning up subscriptions');
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (error) {
          console.log('[useChat] Error unsubscribing:', error);
        }
        subscriptionRef.current = null;
      }
    };
  }, [itemId, otherUserId]);

  const fetchMessages = async () => {
    if (!itemId || !otherUserId) {
      console.log('[useChat] Missing itemId or otherUserId:', { itemId, otherUserId });
      return;
    }

    console.log(`[useChat] Fetching messages for item: ${itemId}, otherUser: ${otherUserId}`);

    try {
      setLoading(true);
      setError(null);

      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        console.log('[useChat] No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, full_name, profile_pic),
          receiver:users!receiver_id(id, full_name, profile_pic)
        `)
        .eq('item_id', itemId)
        .or(`and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.data.user.id}),and(sender_id.eq.${currentUser.data.user.id},receiver_id.eq.${otherUserId})`)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      console.log(`[useChat] Fetched ${data?.length || 0} messages:`, data);

      setMessages(data || []);

      // Count unread messages (now that read_at column exists)
      const unread = data?.filter(msg =>
        msg.receiver_id === currentUser.data.user.id && !msg.read_at
      ).length || 0;
      setUnreadCount(unread);

      console.log(`[useChat] Unread count: ${unread}`);
    } catch (err: any) {
      setError(err.message);
      console.error('[useChat] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) return;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, full_name, profile_pic),
          receiver:users!receiver_id(id, full_name, profile_pic),
          item:items(id, title, status, image)
        `)
        .or(`sender_id.eq.${currentUser.data.user.id},receiver_id.eq.${currentUser.data.user.id}`)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Group messages by item and participants
      const threadMap = new Map<string, ChatThread>();
      
      data?.forEach(message => {
        const otherParticipantId = message.sender_id === currentUser.data.user?.id
          ? message.receiver_id
          : message.sender_id;

        const threadKey = `${message.item_id}-${otherParticipantId}`;

        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, {
            id: threadKey,
            item_id: message.item_id,
            participant_1_id: currentUser.data.user!.id,
            participant_2_id: otherParticipantId,
            last_message: message,
            created_at: message.sent_at,
            updated_at: message.sent_at,
            item: message.item,
            participant_1: currentUser.data.user?.id === message.sender_id ? message.sender : message.receiver,
            participant_2: currentUser.data.user?.id === message.sender_id ? message.receiver : message.sender,
          });
        } else {
          const thread = threadMap.get(threadKey)!;
          if (new Date(message.sent_at) > new Date(thread.updated_at)) {
            thread.last_message = message;
            thread.updated_at = message.sent_at;
          }
        }
      });

      setThreads(Array.from(threadMap.values()));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!itemId || !otherUserId || !currentUserIdRef.current) {
      console.log('[useChat] Missing required IDs for subscription');
      return;
    }

    console.log(`[useChat] Setting up realtime subscription for item: ${itemId}`);

    const channel = supabase
      .channel(`messages:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          console.log('[useChat] New message received:', payload);
          const newMessage = payload.new as Message;

          // Play sound for incoming messages only
          if (newMessage.receiver_id === currentUserIdRef.current) {
            await playMessageSound();
          }

          // Fetch the complete message with user details
          const { data: messageWithDetails } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, full_name, profile_pic),
              receiver:users!receiver_id(id, full_name, profile_pic)
            `)
            .eq('id', newMessage.id)
            .single();

          if (messageWithDetails) {
            setMessages((prev) => [...prev, messageWithDetails]);
            
            // Send push notification for incoming messages
            if (messageWithDetails.receiver_id === currentUserIdRef.current && AppState.currentState !== 'active') {
              notificationService.sendMessageNotification(
                messageWithDetails.receiver_id,
                messageWithDetails.sender.full_name,
                messageWithDetails.message,
                'Item', // You might want to pass the actual item title here
                {
                  type: 'message',
                  itemId: messageWithDetails.item_id,
                  senderId: messageWithDetails.sender_id,
                  messagePreview: messageWithDetails.message
                }
              );
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const subscribeToReadReceipts = () => {
    if (!itemId || !currentUserIdRef.current) return;

    supabase
      .channel(`read_receipts:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          // Update message read status in real-time
          if (payload.new.read_at && !payload.old.read_at) {
            setMessages(prev => prev.map(msg =>
              msg.id === payload.new.id
                ? { ...msg, read_at: payload.new.read_at }
                : msg
            ));

            // Update unread count if it's our message that was read
            if (payload.new.receiver_id === currentUserIdRef.current) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();
  };

  const subscribeToAllMessages = () => {
    if (!currentUserIdRef.current) return;

    subscriptionRef.current = supabase
      .channel('all_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserIdRef.current}`,
        },
        async (payload) => {
          // Refresh threads when new message arrives
          await fetchThreads();

          // Send notification if app is in background
          if (AppState.currentState !== 'active') {
            const { data: messageData } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!sender_id(id, full_name, profile_pic),
                item:items(id, title)
              `)
              .eq('id', payload.new.id)
              .single();

            if (messageData?.sender && messageData?.item) {
              await notificationService.sendMessageNotification(
                payload.new.receiver_id,
                messageData.sender.full_name,
                payload.new.message,
                messageData.item.title,
                {
                  type: 'message',
                  itemId: payload.new.item_id,
                  senderId: payload.new.sender_id,
                  senderName: messageData.sender.full_name,
                  messagePreview: payload.new.message,
                  chatId: `${payload.new.item_id}-${payload.new.sender_id}`,
                }
              );
            }
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async (content: string, receiverId: string): Promise<Message | null> => {
    if (!itemId || !content.trim()) return null;

    console.log(`[useChat] Sending message: "${content}" to user: ${receiverId}`);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('No authenticated user');

      // Get current user's profile for optimistic message
      const { data: userProfile } = await supabase
        .from('users')
        .select('full_name, profile_pic')
        .eq('id', currentUser.data.user.id)
        .single();

      // Create optimistic message for instant UI update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}-${Math.random()}`, // Unique temporary ID
        message: content.trim(),
        sender_id: currentUser.data.user.id,
        receiver_id: receiverId,
        item_id: itemId,
        sent_at: new Date().toISOString(),
        sender: {
          id: currentUser.data.user.id,
          full_name: userProfile?.full_name || 'You',
          profile_pic: userProfile?.profile_pic || null,
          email: currentUser.data.user.email || '',
          created_at: '',
        },
      };

      console.log('[useChat] Adding optimistic message:', optimisticMessage);

      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Send the actual message to database
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            message: content.trim(),
            sender_id: currentUser.data.user.id,
            receiver_id: receiverId,
            item_id: itemId,
          },
        ])
        .select(`
          *,
          sender:users!sender_id(id, full_name, profile_pic),
          receiver:users!receiver_id(id, full_name, profile_pic)
        `)
        .single();

      if (error) throw error;

      console.log('[useChat] Message sent successfully:', data);

      // The real-time subscription will handle replacing the optimistic message
      // But we'll also do it here as a fallback
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessage.id ? data : msg
        ));
      }, 100);

      return data;
    } catch (error: any) {
      console.error('[useChat] Error sending message:', error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));

      setError(error.message);
      return null;
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) return;

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .eq('receiver_id', currentUser.data.user.id)
        .is('read_at', null);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg =>
        messageIds.includes(msg.id) && msg.receiver_id === currentUser.data.user!.id
          ? { ...msg, read_at: new Date().toISOString() }
          : msg
      ));

      // Update unread count
      const unreadMessages = messageIds.filter(id => {
        const msg = messages.find(m => m.id === id);
        return msg && msg.receiver_id === currentUser.data.user!.id && !msg.read_at;
      });
      setUnreadCount(prev => Math.max(0, prev - unreadMessages.length));

    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!itemId || !otherUserId) return;

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) return;

      const unreadMessages = messages.filter(msg =>
        msg.receiver_id === currentUser.data.user!.id && !msg.read_at
      );

      if (unreadMessages.length > 0) {
        await markAsRead(unreadMessages.map(msg => msg.id));
      }
    } catch (error: any) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const getUnreadMessagesCount = (threadId?: string): number => {
    if (threadId) {
      // Count unread messages for specific thread
      return messages.filter(msg =>
        msg.receiver_id === currentUserIdRef.current &&
        !msg.read_at &&
        `${msg.item_id}-${msg.sender_id}` === threadId
      ).length;
    }
    return unreadCount;
  };

  const isMessageRead = (message: Message): boolean => {
    return !!message.read_at;
  };

  return {
    messages,
    threads,
    loading,
    error,
    unreadCount,
    sendMessage,
    markAsRead,
    markAllAsRead,
    getUnreadMessagesCount,
    isMessageRead,
    refetchMessages: fetchMessages,
    refetchThreads: fetchThreads,
  };
};
