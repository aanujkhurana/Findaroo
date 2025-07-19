import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { inAppNotificationService, InAppNotification } from '../services/inAppNotificationService';

export const useInAppNotifications = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await inAppNotificationService.fetchNotifications(session.user.id);
      setNotifications(data);
      
      // Get unread count
      const count = await inAppNotificationService.getUnreadCount(session.user.id);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('[useInAppNotifications] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await inAppNotificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return success;
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return false;

    const success = await inAppNotificationService.markAllAsRead(session.user.id);
    if (success) {
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          read_at: notif.read_at || new Date().toISOString()
        }))
      );
      setUnreadCount(0);
    }
    return success;
  }, [session?.user?.id]);

  // Create a test notification (for development)
  const createTestNotification = useCallback(async (
    type: InAppNotification['type'],
    title: string,
    body: string,
    data: any = {}
  ) => {
    if (!session?.user?.id) return false;

    return await inAppNotificationService.createNotification(
      session.user.id,
      type,
      title,
      body,
      data
    );
  }, [session?.user?.id]);

  // Cleanup old notifications
  const cleanupOldNotifications = useCallback(async () => {
    if (!session?.user?.id) return false;

    return await inAppNotificationService.cleanupOldNotifications(session.user.id);
  }, [session?.user?.id]);

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((notification: InAppNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Handle unread count change from real-time subscription
  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!session?.user?.id) return;

    const cleanup = inAppNotificationService.subscribeToNotifications(
      session.user.id,
      handleNewNotification,
      handleUnreadCountChange
    );

    return cleanup;
  }, [session?.user?.id, handleNewNotification, handleUnreadCountChange]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Cleanup old notifications periodically (once per session)
  useEffect(() => {
    if (session?.user?.id) {
      cleanupOldNotifications();
    }
  }, [session?.user?.id, cleanupOldNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification,
    cleanupOldNotifications,
  };
};
