import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, NotificationData } from '../services/notificationService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (session?.user) {
        // Initialize notification service
        const initialized = await notificationService.initialize();
        if (!initialized) {
          console.log('Failed to initialize notifications');
          return;
        }

        // Set up notification listeners
        setupNotificationListeners();
        
        // Handle app state changes
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
          appStateSubscription?.remove();
          cleanupListeners();
        };
      }
    };

    initializeNotifications();
  }, [session?.user]);

  const setupNotificationListeners = () => {
    // Handle notifications received while app is in foreground
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        
        // You can customize foreground notification behavior here
        // For example, show a custom in-app notification
        handleForegroundNotification(notification);
      }
    );

    // Handle notification responses (when user taps on notification)
    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );
  };

  const handleForegroundNotification = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;
    
    if (data.type === 'message') {
      // Update badge count
      updateBadgeCount();
      
      // You could show a custom toast or banner here
      // For now, we'll let the system handle it
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;

    if (data.type === 'message' && data.itemId && data.senderId && navigation) {
      try {
        // Navigate to the specific chat
        navigation.navigate('Chat', {
          itemId: data.itemId,
          otherUserId: data.senderId,
          otherUserName: data.senderName || 'User',
        });

        // Clear the notification badge
        notificationService.clearBadge();
      } catch (error) {
        console.error('Error navigating from notification:', error);
      }
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('App has come to the foreground');
      
      // Clear badge when app becomes active
      notificationService.clearBadge();
    }
    
    appStateRef.current = nextAppState;
  };

  const updateBadgeCount = async () => {
    try {
      // You could implement a more sophisticated badge count system here
      // For now, we'll just increment the current badge count
      const currentCount = await notificationService.getBadgeCount();
      await notificationService.setBadgeCount(currentCount + 1);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  const cleanupListeners = () => {
    if (notificationListener.current) {
      notificationService.removeNotificationSubscription(notificationListener.current);
    }
    
    if (responseListener.current) {
      notificationService.removeNotificationSubscription(responseListener.current);
    }
  };

  const scheduleTestNotification = async () => {
    await notificationService.scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from Findaroo',
      { type: 'message' },
      2 // 2 seconds delay
    );
  };

  return {
    scheduleTestNotification,
    updateBadgeCount,
  };
};
