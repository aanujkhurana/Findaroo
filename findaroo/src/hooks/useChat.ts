import { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { Message, ChatThread } from '../types';

// Sound playing function
const playMessageSound = async () => {
  try {
    // Set audio mode for better sound playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Use a simple system sound for message notifications
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }, // Simple notification sound
      {
        shouldPlay: true,
        volume: 0.4,
        isLooping: false
      }
    );

    // Play the sound
    await sound.playAsync();

    // Unload the sound after playing
    setTimeout(() => {
      sound.unloadAsync();
    }, 2000);
  } catch (error) {
    // Fallback - just log the error, don't crash the app
    console.log('[useChat] Sound playback failed (this is normal in simulator):', error.message);
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
    const initializeChat = async () => {
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        currentUserIdRef.current = currentUser.data.user.id;
      }

      if (itemId && otherUserId) {
        await fetchMessages();
        // Small delay to ensure messages are loaded before subscribing
        setTimeout(() => {
          subscribeToMessages();
          subscribeToReadReceipts();
        }, 100);
      } else {
        await fetchThreads();
        setTimeout(() => {
          subscribeToAllMessages();
        }, 100);
      }
    };

    initializeChat();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[useChat] Cleaning up subscriptions');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
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
    if (!itemId || !currentUserIdRef.current) {
      console.log('[useChat] Cannot subscribe - missing itemId or currentUser');
      return;
    }

    console.log(`[useChat] Setting up real-time subscription for item: ${itemId}`);

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      console.log('[useChat] Cleaning up existing subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    const channelName = `messages-${itemId}-${currentUserIdRef.current}`;
    console.log(`[useChat] Creating channel: ${channelName}`);

    subscriptionRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          console.log('[useChat] Real-time message received:', payload.new);

          try {
            // Always fetch the full message with user data for real-time updates
            const { data, error } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!sender_id(id, full_name, profile_pic),
                receiver:users!receiver_id(id, full_name, profile_pic)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('[useChat] Error fetching real-time message:', error);
              return;
            }

            if (data) {
              console.log('[useChat] Processing real-time message:', data);

              // If it's our own message, replace the optimistic one
              if (data.sender_id === currentUserIdRef.current) {
                console.log('[useChat] Replacing optimistic message with real one');
                setMessages(prev => prev.map(msg =>
                  msg.id.startsWith('temp-') && msg.message === data.message
                    ? data
                    : msg
                ));
              } else {
                // It's a message from someone else, add it
                console.log('[useChat] Adding message from other user');
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === data.id);
                  if (exists) {
                    console.log('[useChat] Message already exists, skipping');
                    return prev;
                  }
                  return [...prev, data];
                });

                // Play notification sound for incoming messages
                playMessageSound();

                // Send push notification if app is in background
                if (AppState.currentState !== 'active') {
                  console.log('[useChat] App in background, sending push notification');

                  const { data: item } = await supabase
                    .from('items')
                    .select('title')
                    .eq('id', itemId)
                    .single();

                  if (item && data.sender) {
                    await notificationService.sendMessageNotification(
                      data.receiver_id,
                      data.sender.full_name,
                      data.message,
                      item.title,
                      {
                        type: 'message',
                        itemId: itemId,
                        senderId: data.sender_id,
                        senderName: data.sender.full_name,
                        messagePreview: data.message,
                        chatId: `${itemId}-${data.sender_id}`,
                      }
                    );
                  }
                }
              }

              // Update unread count for received messages
              if (data.receiver_id === currentUserIdRef.current && data.sender_id !== currentUserIdRef.current) {
                setUnreadCount(prev => prev + 1);
              }
            }
          } catch (error) {
            console.error('[useChat] Error processing real-time message:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useChat] Subscription status for ${channelName}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log('[useChat] ✅ Successfully subscribed to real-time messages');
        } else if (status === 'CLOSED') {
          console.log('[useChat] ❌ Real-time subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('[useChat] ⚠️ Channel error, attempting to reconnect...');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (itemId && currentUserIdRef.current) {
              subscribeToMessages();
            }
          }, 2000);
        }
      });
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
