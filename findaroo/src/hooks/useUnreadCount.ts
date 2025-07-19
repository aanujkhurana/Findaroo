import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

export const useUnreadCount = () => {
  const { session } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setTotalUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', session.user.id)
          .is('read_at', null);

        if (error) {
          console.error('[useUnreadCount] Error fetching unread count:', error);
          return;
        }

        setTotalUnreadCount(count || 0);
      } catch (err) {
        console.error('[useUnreadCount] Error:', err);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up real-time subscription for both INSERT and UPDATE events
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = supabase
      .channel(`unread_count:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        () => {
          console.log('[useUnreadCount] New message received, updating count');
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('[useUnreadCount] Message updated, updating count', payload);
          fetchUnreadCount();
        }
      )
      .subscribe((status) => {
        console.log(`[useUnreadCount] Subscription status: ${status}`);
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [session?.user?.id]);

  return { totalUnreadCount };
};
