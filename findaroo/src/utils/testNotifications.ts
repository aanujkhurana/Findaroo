import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

export const createTestNotifications = async (userId: string) => {
  try {
    console.log('Creating test notifications for user:', userId);

    // Test message notification
    await notificationService.createNotification(
      userId,
      'message',
      'New message from John Doe',
      'About "Lost iPhone 13": Hi, I think I found your phone near the library!',
      {
        type: 'message',
        itemId: 'test-item-1',
        senderId: 'test-sender-1',
        senderName: 'John Doe'
      }
    );

    // Test item update notification
    await notificationService.createNotification(
      userId,
      'item_update',
      'Item Status Updated',
      'Your lost wallet has been marked as found by someone nearby.',
      {
        type: 'item_update',
        itemId: 'test-item-2'
      }
    );

    // Test tip received notification
    await notificationService.createNotification(
      userId,
      'tip_received',
      'Tip Received!',
      'You received a $10 tip for returning a lost item. Thank you for being awesome!',
      {
        type: 'tip_received',
        amount: 10
      }
    );

    // Test karma update notification
    await notificationService.createNotification(
      userId,
      'karma_update',
      'Karma Points Earned',
      'You earned 50 karma points for helping return a lost item to its owner.',
      {
        type: 'karma_update',
        points: 50
      }
    );

    // Test system notification
    await notificationService.createNotification(
      userId,
      'system',
      'Welcome to Findaroo!',
      'Thanks for joining our community. Start by posting your first lost or found item.',
      {
        type: 'system'
      }
    );

    console.log('Test notifications created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return false;
  }
};

export const clearAllNotifications = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }

    console.log('All notifications cleared successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
};
