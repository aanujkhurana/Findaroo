import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { Message, ChatThread } from '../types';
import { karmaService } from '../services/karmaService';

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

    // Use Expo's notification sound (no 'content' property, just top-level)
    await Notifications.presentNotificationAsync({
      title: 'New Message',
      body: 'You have a new message',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.log('[useChat] Sound playback failed:', errMsg);
  }
};

export const useChat = (itemId?: string, otherUserId?: string) => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const initializationRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const isFetchingRef = useRef<boolean>(false);



  const fetchMessages = React.useCallback(async () => {
    if (!itemId || !otherUserId) {
      console.log('[useChat] Missing itemId or otherUserId:', { itemId, otherUserId });
      return;
    }

    if (isFetchingRef.current) {
      console.log('[useChat] Already fetching messages, skipping...');
      return;
    }

    console.log(`[useChat] Fetching messages for item: ${itemId}, otherUser: ${otherUserId}`);

    try {
      isFetchingRef.current = true;
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
        currentUser.data.user &&
        msg.receiver_id === currentUser.data.user.id && !msg.read_at
      ).length || 0;
      setUnreadCount(unread);

      console.log(`[useChat] Unread count: ${unread}`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('[useChat] Error fetching messages:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [itemId, otherUserId]);

  const markAllAsRead = React.useCallback(async () => {
    if (!itemId || !currentUserIdRef.current) return;

    try {
      console.log('[useChat] Marking all messages as read for item:', itemId);

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('item_id', itemId)
        .eq('receiver_id', currentUserIdRef.current)
        .is('read_at', null);

      if (error) throw error;

      console.log('[useChat] Messages marked as read successfully');

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
    if (isFetchingRef.current) {
      console.log('[useChat] Already fetching threads, skipping...');
      return;
    }

    console.log('[useChat] Fetching threads...');

    try {
      isFetchingRef.current = true;
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
      setError(err instanceof Error ? err.message : String(err));
      console.error('[useChat] Error fetching threads:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);



  // Initialize chat functionality
  React.useEffect(() => {
    // Create a unique key for this hook instance
    const hookKey = `${itemId || 'no-item'}-${otherUserId || 'no-user'}`;

    if (initializationRef.current || isInitializingRef.current) {
      console.log('[useChat] Already initialized or initializing, skipping...', hookKey);
      return;
    }

    console.log('[useChat] EFFECT STARTING - itemId:', itemId, 'otherUserId:', otherUserId);

    // Mark as initializing
    isInitializingRef.current = true;

    let isMounted = true;

    const initialize = async () => {
      try {
        console.log('[useChat] Getting current user...');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.log('[useChat] No user found');
          setLoading(false);
          isInitializingRef.current = false;
          return;
        }

        if (!isMounted) {
          isInitializingRef.current = false;
          return;
        }

        currentUserIdRef.current = user.id;
        console.log('[useChat] User set:', user.id);

        if (itemId && otherUserId) {
          console.log('[useChat] Fetching messages for chat...');
          await fetchMessages();
          subscribeToMessages();
        } else {
          console.log('[useChat] Fetching threads...');
          await fetchThreads();
          subscribeToAllMessages();
        }

        // Mark as initialized only after successful completion
        initializationRef.current = true;
        isInitializingRef.current = false;
      } catch (error) {
        console.error('[useChat] Initialization error:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize chat');
        setLoading(false);
        isInitializingRef.current = false;
      }
    };

    initialize();

    return () => {
      console.log('[useChat] CLEANUP RUNNING', hookKey);
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      initializationRef.current = false;
      isInitializingRef.current = false;
    };
  }, [itemId, otherUserId]);

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
                  body: messageData.message, // Fixed: use 'message' field instead of 'content'
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
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' :
                          status === 'CHANNEL_ERROR' ? 'disconnected' : 'connecting');
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
                body: messageData.message, // Fixed: use 'message' field instead of 'content'
                sound: 'default',
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useChat] All messages subscription status: ${status}`);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' :
                          status === 'CHANNEL_ERROR' ? 'disconnected' : 'connecting');
      });
  }, []);

  const sendMessage = React.useCallback(async (content: string, receiverId: string): Promise<Message | null> => {
    if (!itemId || !currentUserIdRef.current) {
      console.error('[useChat] Cannot send message: Missing itemId or user');
      return null;
    }

    // Prevent users from messaging themselves
    if (currentUserIdRef.current === receiverId) {
      console.error('[useChat] Cannot send message to yourself');
      setError('You cannot send messages to yourself');
      return null;
    }

    try {
      // Check if this is the first message between these users for this item
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('item_id', itemId)
        .or(`and(sender_id.eq.${currentUserIdRef.current},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserIdRef.current})`)
        .limit(1);

      const isFirstMessage = !existingMessages || existingMessages.length === 0;

      const messageData = {
        item_id: itemId,
        sender_id: currentUserIdRef.current,
        receiver_id: receiverId,
        message: content, // Fixed: use 'message' field instead of 'content'
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

      // Award karma for first message
      if (isFirstMessage) {
        console.log('[useChat] Awarding karma for first message');
        await karmaService.createKarmaEvent(currentUserIdRef.current, 'FIRST_MESSAGE', itemId);
      }

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

  // Add a function to refetch threads
  const refetchThreads = async () => {
    await fetchThreads();
  };

  // Add a function to get unread messages count for a thread
  const getUnreadMessagesCount = (threadId: string): number => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread || !thread.last_message) return 0;
    // If the last message is unread and sent to the current user, count as 1
    if (
      currentUserIdRef.current &&
      thread.last_message.receiver_id === currentUserIdRef.current &&
      !thread.last_message.read_at
    ) {
      return 1;
    }
    return 0;
  };

  // Add a function to check if a message is read
  const isMessageRead = (message: Message): boolean => {
    return !!message.read_at;
  };

  // Get total unread count across all threads
  const getTotalUnreadCount = useCallback((): number => {
    if (!currentUserIdRef.current) return 0;

    return threads.reduce((total, thread) => {
      const threadId = `${thread.item_id}-${thread.participant_1?.id === currentUserIdRef.current ? thread.participant_2?.id : thread.participant_1?.id}`;
      return total + getUnreadMessagesCount(threadId);
    }, 0);
  }, [threads, getUnreadMessagesCount]);

  // Update total unread count when threads change
  useEffect(() => {
    const newTotalUnread = getTotalUnreadCount();
    setTotalUnreadCount(newTotalUnread);
  }, [threads, getTotalUnreadCount]);

  // Send tip function
  const sendTip = useCallback(async (receiverId: string, amount: number, itemId: string): Promise<boolean> => {
    if (!currentUserIdRef.current) {
      console.error('[useChat] Cannot send tip: No authenticated user');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('tips')
        .insert({
          item_id: itemId,
          sender_id: currentUserIdRef.current,
          receiver_id: receiverId,
          amount: amount,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Award karma for sending tip
      console.log('[useChat] Awarding karma for sending tip');
      await karmaService.createKarmaEvent(currentUserIdRef.current, 'SEND_TIP', itemId);

      console.log('[useChat] Tip sent successfully:', data);
      return true;
    } catch (err) {
      console.error('[useChat] Error sending tip:', err);
      setError(err instanceof Error ? err.message : 'Failed to send tip');
      return false;
    }
  }, []);

  // Update item status function
  const updateItemStatus = useCallback(async (itemId: string, newStatus: string): Promise<boolean> => {
    if (!currentUserIdRef.current) {
      console.error('[useChat] Cannot update item status: No authenticated user');
      return false;
    }

    try {
      // Get the current item to check who should get karma
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('user_id, status')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      const { error } = await supabase
        .from('items')
        .update({
          status: newStatus,
          resolved: newStatus === 'returned' || newStatus === 'claimed'
        })
        .eq('id', itemId)
        .eq('user_id', currentUserIdRef.current); // Only item owner can update

      if (error) throw error;

      // Award karma based on status change
      if (newStatus === 'returned' || newStatus === 'claimed') {
        // Award karma to the item owner for successful return
        console.log('[useChat] Awarding karma for successful return');
        await karmaService.createKarmaEvent(currentUserIdRef.current, 'RETURN_SUCCESS', itemId);

        // Find the other user in the conversation to award them karma too
        const { data: messages } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .eq('item_id', itemId)
          .limit(1);

        if (messages && messages.length > 0) {
          const otherUserId = messages[0].sender_id === currentUserIdRef.current
            ? messages[0].receiver_id
            : messages[0].sender_id;

          if (otherUserId !== currentUserIdRef.current) {
            console.log('[useChat] Awarding karma to other user for successful return');
            await karmaService.createKarmaEvent(otherUserId, 'RETURN_SUCCESS', itemId);
          }
        }
      } else if (newStatus === 'kept') {
        // Penalize for keeping item
        console.log('[useChat] Applying karma penalty for keeping item');
        await karmaService.createKarmaEvent(currentUserIdRef.current, 'KEEP_ITEM', itemId);
      } else if (newStatus === 'flagged') {
        // Penalize for getting flagged
        console.log('[useChat] Applying karma penalty for flagged item');
        await karmaService.createKarmaEvent(currentUserIdRef.current, 'GET_FLAGGED', itemId);
      }

      console.log('[useChat] Item status updated successfully');
      return true;
    } catch (err) {
      console.error('[useChat] Error updating item status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item status');
      return false;
    }
  }, []);

  return {
    messages,
    threads,
    loading,
    error,
    unreadCount,
    totalUnreadCount,
    connectionStatus,
    sendMessage,
    markAllAsRead,
    refetchThreads,
    getUnreadMessagesCount,
    getTotalUnreadCount,
    isMessageRead,
    sendTip,
    updateItemStatus,
  };
};

export default useChat;
