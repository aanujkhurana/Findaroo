import { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { Message, ChatThread } from '../types';

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
        subscribeToMessages();
        subscribeToReadReceipts();
      } else {
        await fetchThreads();
        subscribeToAllMessages();
      }
    };

    initializeChat();

    // Cleanup subscriptions on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [itemId, otherUserId]);

  const fetchMessages = async () => {
    if (!itemId || !otherUserId) return;

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
          receiver:users!receiver_id(id, full_name, profile_pic)
        `)
        .eq('item_id', itemId)
        .or(`and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.data.user.id}),and(sender_id.eq.${currentUser.data.user.id},receiver_id.eq.${otherUserId})`)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Count unread messages
      const unread = data?.filter(msg =>
        msg.receiver_id === currentUser.data.user.id && !msg.read_at
      ).length || 0;
      setUnreadCount(unread);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching messages:', err);
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
    if (!itemId || !currentUserIdRef.current) return;

    subscriptionRef.current = supabase
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
          // Fetch the full message with user data
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, full_name, profile_pic),
              receiver:users!receiver_id(id, full_name, profile_pic)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => [...prev, data]);

            // Send push notification if message is for current user and app is in background
            if (data.receiver_id === currentUserIdRef.current &&
                data.sender_id !== currentUserIdRef.current &&
                AppState.currentState !== 'active') {

              // Get item details for notification
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

            // Update unread count
            if (data.receiver_id === currentUserIdRef.current && !data.read_at) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();
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

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('No authenticated user');

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

      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
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
