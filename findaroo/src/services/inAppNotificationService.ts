import { supabase } from './supabaseClient';

export interface InAppNotification {
  id: string;
  user_id: string;
  type: 'message' | 'item_update' | 'system' | 'tip_received' | 'karma_update';
  title: string;
  body: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

class InAppNotificationService {
  private subscriptions: Map<string, any> = new Map();

  // Fetch notifications for a user
  async fetchNotifications(userId: string, limit: number = 50): Promise<InAppNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[InAppNotificationService] Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('[InAppNotificationService] Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[InAppNotificationService] Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[InAppNotificationService] Error marking all notifications as read:', error);
      return false;
    }
  }

  // Subscribe to real-time notifications for a user
  subscribeToNotifications(
    userId: string, 
    onNotification: (notification: InAppNotification) => void,
    onUnreadCountChange: (count: number) => void
  ): () => void {
    const channelName = `notifications:${userId}`;
    
    // Clean up existing subscription
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[InAppNotificationService] New notification:', payload);
          onNotification(payload.new as InAppNotification);
          
          // Update unread count
          this.getUnreadCount(userId).then(onUnreadCountChange);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[InAppNotificationService] Notification updated:', payload);
          
          // Update unread count when read status changes
          this.getUnreadCount(userId).then(onUnreadCountChange);
        }
      )
      .subscribe((status) => {
        console.log(`[InAppNotificationService] Subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);

    // Return cleanup function
    return () => {
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
    };
  }

  // Create a manual notification (for testing or system notifications)
  async createNotification(
    userId: string,
    type: InAppNotification['type'],
    title: string,
    body: string,
    data: any = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          data,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[InAppNotificationService] Error creating notification:', error);
      return false;
    }
  }

  // Delete old notifications (keep last 100 per user)
  async cleanupOldNotifications(userId: string): Promise<boolean> {
    try {
      // Get notifications to delete (keep last 100)
      const { data: notificationsToDelete, error: fetchError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(100, 1000); // Get notifications beyond the first 100

      if (fetchError) throw fetchError;

      if (notificationsToDelete && notificationsToDelete.length > 0) {
        const idsToDelete = notificationsToDelete.map(n => n.id);
        
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
        
        console.log(`[InAppNotificationService] Cleaned up ${idsToDelete.length} old notifications`);
      }

      return true;
    } catch (error) {
      console.error('[InAppNotificationService] Error cleaning up notifications:', error);
      return false;
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type: InAppNotification['type']): string {
    switch (type) {
      case 'message':
        return 'message-circle';
      case 'item_update':
        return 'package';
      case 'tip_received':
        return 'gift';
      case 'karma_update':
        return 'star';
      case 'system':
        return 'info';
      default:
        return 'bell';
    }
  }

  // Get notification color based on type
  getNotificationColor(type: InAppNotification['type']): string {
    switch (type) {
      case 'message':
        return '#2E2E2E'; // Findaroo black accent
      case 'item_update':
        return '#FFA930'; // Findaroo orange
      case 'tip_received':
        return '#33C48D'; // Findaroo green
      case 'karma_update':
        return '#8B5CF6'; // Purple
      case 'system':
        return '#6B7280'; // Gray
      default:
        return '#2E2E2E';
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.subscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

export const inAppNotificationService = new InAppNotificationService();
