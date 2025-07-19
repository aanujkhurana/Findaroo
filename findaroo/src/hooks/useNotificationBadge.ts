import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

export const useNotificationBadge = () => {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    if (!session?.user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const count = await notificationService.getUnreadCount(session.user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [session?.user?.id]);

  // Set up real-time subscription for notification changes
  useEffect(() => {
    if (!session?.user?.id) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          // Refetch count when notifications change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user?.id]);

  return {
    unreadCount,
    loading,
    refreshCount: fetchUnreadCount,
  };
};
