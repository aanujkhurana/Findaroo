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
        subscribeToMessages();
      } else if (isMounted) {
        await fetchThreads();
        subscribeToAllMessages();
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

  const fetchMessages = React.useCallback(async () => {
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

      // Count unread messages
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
  }, [itemId, otherUserId]);

  const markAllAsRead = React.useCallback(async () => {
    if (!itemId || !currentUserIdRef.current) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('item_id', itemId)
        .eq('receiver_id', currentUserIdRef.current)
        .is('read_at', null);

      if (error) throw error;

      setMessages(prev => prev.map(msg =>
        msg.receiver_id === currentUserIdRef.current && !msg.read_at
          ? { ...msg, read_at: new Date().toISOString() }
          : msg
      ));
      setUnreadCount(0);
    } catch (err) {
      console.error('[useChat] Error marking messages as read:', err);
    }
  }, [itemId]);

  const fetchThreads = React.useCallback(async () => {
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
      console.error('[useChat] Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
        subscribeToMessages();
      } else if (isMounted) {
        await fetchThreads();
        subscribeToAllMessages();
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        console.log('[useChat] Cleaning up subscriptions');
        try {
          subscriptionRef.current.unsubscribe();
        } catch (error) {
          console.log('[useChat] Error unsubscribing:', error);
        }
        subscriptionRef.current = null;
      }
    };
  }, [itemId, otherUserId, fetchMessages, fetchThreads]);

  const subscribeToMessages = React.useCallback(() => {
    if (!itemId || !otherUserId || !currentUserIdRef.current) {
      console.log('[useChat] Missing required IDs for subscription');
      return;
    }

    if (subscriptionRef.current) {
      console.log('[useChat] Cleaning up existing subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    console.log(`[useChat] Setting up message subscription for item: ${itemId}`);

    subscriptionRef.current = supabase
      .channel(`messages:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `item_id=eq.${itemId}`,
        },
        async (payload) => {
          console.log('[useChat] Received message update:', payload);

          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new;
            const isRelevantMessage =
              (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUserIdRef.current) ||
              (newMessage.sender_id === currentUserIdRef.current && newMessage.receiver_id === otherUserId);

            if (!isRelevantMessage) {
              console.log('[useChat] Ignoring irrelevant message');
              return;
            }

            // Fetch complete message details including sender and receiver info
            const { data: messageData, error } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!sender_id(id, full_name, profile_pic),
                receiver:users!receiver_id(id, full_name, profile_pic)
              `)
              .eq('id', newMessage.id)
              .single();

            if (error) {
              console.error('[useChat] Error fetching message details:', error);
              return;
            }

            // Check if message already exists to prevent duplicates
            setMessages(prev => {
              if (prev.some(msg => msg.id === messageData.id)) {
                console.log('[useChat] Message already exists, skipping');
                return prev;
              }

              // Play sound and send notification for incoming messages
              if (messageData.receiver_id === currentUserIdRef.current) {
                Notifications.presentNotificationAsync({
                  title: messageData.sender.full_name,
                  body: messageData.content,
                  sound: 'default',
                });
              }

              return [...prev, messageData];
            });

            // Update unread count for incoming messages
            if (messageData.receiver_id === currentUserIdRef.current) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useChat] Subscription status: ${status}`);
      });
  }, [itemId, otherUserId]);

  const subscribeToReadReceipts = React.useCallback(() => {
    if (!itemId || !currentUserIdRef.current) return;

    const channel = supabase
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
          console.log('[useChat] Read receipt update:', payload);
          const updatedMessage = payload.new;

          if (updatedMessage.read_at) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === updatedMessage.id ? { ...msg, read_at: updatedMessage.read_at } : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [itemId]);

  const subscribeToAllMessages = React.useCallback(() => {
    if (!currentUserIdRef.current) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    console.log('[useChat] Setting up subscription for all messages');

    subscriptionRef.current = supabase
      .channel('all_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${currentUserIdRef.current},receiver_id.eq.${currentUserIdRef.current})`,
        },
        async (payload) => {
          console.log('[useChat] Message update received:', payload);

          if (payload.eventType === 'INSERT') {
            const { data: messageData, error } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!sender_id(id, full_name, profile_pic),
                receiver:users!receiver_id(id, full_name, profile_pic),
                item:items(id, title, status, image)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('[useChat] Error fetching message details:', error);
              return;
            }

            // Update threads with new message
            setThreads(prev => {
              const threadKey = `${messageData.item_id}-${messageData.sender_id === currentUserIdRef.current ? messageData.receiver_id : messageData.sender_id}`;
              const existingThread = prev.find(t => t.id === threadKey);

              if (existingThread) {
                return prev.map(thread =>
                  thread.id === threadKey
                    ? { ...thread, last_message: messageData, updated_at: messageData.sent_at }
                    : thread
                );
              }

              // Create new thread if it doesn't exist
              const newThread: ChatThread = {
                id: threadKey,
                item_id: messageData.item_id,
                participant_1_id: currentUserIdRef.current!,
                participant_2_id: messageData.sender_id === currentUserIdRef.current ? messageData.receiver_id : messageData.sender_id,
                last_message: messageData,
                created_at: messageData.sent_at,
                updated_at: messageData.sent_at,
                item: messageData.item,
                participant_1: messageData.sender_id === currentUserIdRef.current ? messageData.sender : messageData.receiver,
                participant_2: messageData.sender_id === currentUserIdRef.current ? messageData.receiver : messageData.sender,
              };

              return [...prev, newThread];
            });

            // Play sound and show notification for incoming messages
            if (messageData.receiver_id === currentUserIdRef.current) {
              Notifications.presentNotificationAsync({
                title: messageData.sender.full_name,
                body: messageData.content,
                sound: 'default',
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useChat] All messages subscription status: ${status}`);
      });
  }, []);

  const sendMessage = React.useCallback(async (content: string, receiverId: string): Promise<Message | null> => {
    if (!itemId || !currentUserIdRef.current) {
      console.error('[useChat] Cannot send message: Missing itemId or user');
      return null;
    }

    try {
      const messageData = {
        item_id: itemId,
        sender_id: currentUserIdRef.current,
        receiver_id: receiverId,
        content,
        sent_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:users!sender_id(id, full_name, profile_pic),
          receiver:users!receiver_id(id, full_name, profile_pic)
        `)
        .single();

      if (error) throw error;

      // Optimistically update the messages list
      setMessages(prev => [...prev, data]);

      console.log('[useChat] Message sent successfully:', data);
      return data;
    } catch (err) {
      console.error('[useChat] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [itemId]);

  return {
    messages,
    threads,
    loading,
    error,
    unreadCount,
    sendMessage,
    markAllAsRead,
  };
};

export default useChat;
