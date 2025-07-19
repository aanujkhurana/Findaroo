import React, { useState, useEffect, useRef } from 'react';
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
        console.log('[useUnreadCount] Fetching unread count for user:', session.user.id);

        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', session.user.id)
          .is('read_at', null);

        if (error) {
          console.error('[useUnreadCount] Error fetching unread count:', error);
          return;
        }

        console.log('[useUnreadCount] Fetched unread count:', count);
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
        (payload) => {
          console.log('[useUnreadCount] New message received:', payload);
          // Small delay to ensure the database is updated
          setTimeout(() => fetchUnreadCount(), 100);
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
          console.log('[useUnreadCount] Message updated:', payload);
          // Check if this is a read_at update
          if (payload.new?.read_at && !payload.old?.read_at) {
            console.log('[useUnreadCount] Message marked as read, updating count');
          }
          // Small delay to ensure the database is updated
          setTimeout(() => fetchUnreadCount(), 100);
        }
      )
      .subscribe((status) => {
        console.log(`[useUnreadCount] Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('[useUnreadCount] Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useUnreadCount] Channel error, retrying subscription...');
          // Retry subscription after a delay
          setTimeout(() => {
            if (subscriptionRef.current) {
              subscriptionRef.current.unsubscribe();
            }
            // Re-run the effect to recreate subscription
            fetchUnreadCount();
          }, 2000);
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [session?.user?.id]);

  // Manual refresh function for debugging
  const refreshUnreadCount = React.useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log('[useUnreadCount] Manual refresh triggered');
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', session.user.id)
        .is('read_at', null);

      if (error) {
        console.error('[useUnreadCount] Error in manual refresh:', error);
        return;
      }

      console.log('[useUnreadCount] Manual refresh result:', count);
      setTotalUnreadCount(count || 0);
    } catch (err) {
      console.error('[useUnreadCount] Manual refresh error:', err);
    }
  }, [session?.user?.id]);

  return {
    totalUnreadCount,
    refreshUnreadCount
  };
};
