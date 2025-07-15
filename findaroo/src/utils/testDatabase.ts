import { supabase } from '../services/supabaseClient';

export const testDatabaseConnection = async () => {
  try {
    console.log('[Database Test] Testing connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('[Database Test] Connection error:', testError);
      return false;
    }
    
    console.log('[Database Test] Connection successful');
    
    // Test messages table structure
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('id, message, sender_id, receiver_id, item_id, sent_at, read_at')
      .limit(1);
    
    if (messagesError) {
      console.error('[Database Test] Messages table error:', messagesError);
      return false;
    }
    
    console.log('[Database Test] Messages table structure OK');
    
    // Test users table structure
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, profile_pic, push_token')
      .limit(1);
    
    if (usersError) {
      console.error('[Database Test] Users table error:', usersError);
      return false;
    }
    
    console.log('[Database Test] Users table structure OK');
    
    return true;
  } catch (error) {
    console.error('[Database Test] Unexpected error:', error);
    return false;
  }
};

export const testRealTimeConnection = async () => {
  try {
    console.log('[Real-time Test] Testing real-time connection...');
    
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        console.log('[Real-time Test] Received payload:', payload);
      })
      .subscribe((status) => {
        console.log('[Real-time Test] Subscription status:', status);
      });
    
    // Clean up after 5 seconds
    setTimeout(() => {
      channel.unsubscribe();
      console.log('[Real-time Test] Unsubscribed from test channel');
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('[Real-time Test] Error:', error);
    return false;
  }
};
