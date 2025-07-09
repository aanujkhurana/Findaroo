import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Message, ChatThread } from '../types';

export const useChat = (itemId?: string, otherUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId && otherUserId) {
      fetchMessages();
      subscribeToMessages();
    } else {
      fetchThreads();
    }
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
          sender:users!sender_id(id, full_name, avatar_url),
          recipient:users!recipient_id(id, full_name, avatar_url)
        `)
        .eq('item_id', itemId)
        .or(`and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.data.user.id}),and(sender_id.eq.${currentUser.data.user.id},recipient_id.eq.${otherUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
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
          sender:users!sender_id(id, full_name, avatar_url),
          recipient:users!recipient_id(id, full_name, avatar_url),
          item:items(id, title, status, image_url)
        `)
        .or(`sender_id.eq.${currentUser.data.user.id},recipient_id.eq.${currentUser.data.user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by item and participants
      const threadMap = new Map<string, ChatThread>();
      
      data?.forEach(message => {
        const otherParticipantId = message.sender_id === currentUser.data.user?.id 
          ? message.recipient_id 
          : message.sender_id;
        
        const threadKey = `${message.item_id}-${otherParticipantId}`;
        
        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, {
            id: threadKey,
            item_id: message.item_id,
            participant_1_id: currentUser.data.user!.id,
            participant_2_id: otherParticipantId,
            last_message: message,
            created_at: message.created_at,
            updated_at: message.created_at,
            item: message.item,
            participant_1: currentUser.data.user?.id === message.sender_id ? message.sender : message.recipient,
            participant_2: currentUser.data.user?.id === message.sender_id ? message.recipient : message.sender,
          });
        } else {
          const thread = threadMap.get(threadKey)!;
          if (new Date(message.created_at) > new Date(thread.updated_at)) {
            thread.last_message = message;
            thread.updated_at = message.created_at;
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
    if (!itemId) return;

    const subscription = supabase
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
              sender:users!sender_id(id, full_name, avatar_url),
              recipient:users!recipient_id(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (content: string, recipientId: string): Promise<Message | null> => {
    if (!itemId || !content.trim()) return null;

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content: content.trim(),
            sender_id: currentUser.data.user.id,
            recipient_id: recipientId,
            item_id: itemId,
          },
        ])
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url),
          recipient:users!recipient_id(id, full_name, avatar_url)
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
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    messages,
    threads,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetchMessages: fetchMessages,
    refetchThreads: fetchThreads,
  };
};
