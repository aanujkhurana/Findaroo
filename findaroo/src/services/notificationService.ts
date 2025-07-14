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
      // Get recipient's push token
      const { data: recipient, error } = await supabase
        .from('users')
        .select('push_token, full_name')
        .eq('id', recipientUserId)
        .single();

      if (error || !recipient?.push_token) {
        console.log('No push token found for recipient:', recipientUserId);
        return false;
      }

      // Send notification via Expo's push service
      const message = {
        to: recipient.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
        channelId: data?.type === 'message' ? 'messages' : 'updates',
      };

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
      
      if (result.data?.status === 'error') {
        console.error('Push notification error:', result.data.message);
        return false;
      }

      console.log('Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
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
}

export const notificationService = new NotificationService();
