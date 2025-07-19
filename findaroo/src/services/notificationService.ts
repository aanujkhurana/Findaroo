import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'message' | 'item_update' | 'tip_received';
  itemId?: string;
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
  chatId?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.expoPushToken = token.data;
      console.log('Push token:', this.expoPushToken);

      // Save token to user profile
      await this.savePushTokenToProfile(this.expoPushToken);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3A8DFF',
        });

        await Notifications.setNotificationChannelAsync('updates', {
          name: 'Item Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFA930',
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async savePushTokenToProfile(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token to profile:', error);
    }
  }

  async sendPushNotification(
    recipientUserId: string,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<boolean> {
    try {
      console.log(`[NotificationService] Attempting to send push notification to user: ${recipientUserId}`);

      // Get recipient's push token
      const { data: recipient, error } = await supabase
        .from('users')
        .select('push_token, full_name')
        .eq('id', recipientUserId)
        .single();

      if (error) {
        console.error('[NotificationService] Error fetching recipient:', error);
        return false;
      }

      if (!recipient?.push_token) {
        console.log(`[NotificationService] No push token found for recipient: ${recipientUserId}`);
        return false;
      }

      console.log(`[NotificationService] Found push token for ${recipient.full_name}`);

      // Send notification via Expo's push service
      const message = {
        to: recipient.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
        channelId: data?.type === 'message' ? 'messages' : 'updates',
        priority: 'high',
        badge: 1,
      };

      console.log('[NotificationService] Sending push notification:', { title, body, to: recipient.push_token });

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('[NotificationService] Push notification response:', result);

      if (result.data?.status === 'error') {
        console.error('[NotificationService] Push notification error:', result.data.message);
        return false;
      }

      console.log('[NotificationService] ✅ Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('[NotificationService] Error sending push notification:', error);
      return false;
    }
  }

  async sendMessageNotification(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    itemTitle: string,
    data: NotificationData
  ): Promise<boolean> {
    const title = `New message from ${senderName}`;
    const body = `About "${itemTitle}": ${messagePreview}`;
    
    return this.sendPushNotification(recipientUserId, title, body, data);
  }

  async sendItemUpdateNotification(
    recipientUserId: string,
    title: string,
    body: string,
    data: NotificationData
  ): Promise<boolean> {
    return this.sendPushNotification(recipientUserId, title, body, data);
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    delaySeconds: number = 0
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Add notification listeners
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  removeNotificationSubscription(subscription: Notifications.Subscription) {
    Notifications.removeNotificationSubscription(subscription);
  }

  // Database notification methods
  async createNotification(
    userId: string,
    type: 'message' | 'item_update' | 'system' | 'tip_received' | 'karma_update',
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          data: data || {},
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Enhanced message notification that also creates database record
  async sendMessageNotificationWithDB(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    itemTitle: string,
    data: NotificationData
  ): Promise<boolean> {
    // Create database notification
    await this.createNotification(
      recipientUserId,
      'message',
      `New message from ${senderName}`,
      `About "${itemTitle}": ${messagePreview}`,
      data
    );

    // Send push notification
    return this.sendMessageNotification(recipientUserId, senderName, messagePreview, itemTitle, data);
  }

  // Enhanced item update notification that also creates database record
  async sendItemUpdateNotificationWithDB(
    recipientUserId: string,
    title: string,
    body: string,
    data: NotificationData
  ): Promise<boolean> {
    // Create database notification
    await this.createNotification(recipientUserId, 'item_update', title, body, data);

    // Send push notification
    return this.sendItemUpdateNotification(recipientUserId, title, body, data);
  }
}

export const notificationService = new NotificationService();
