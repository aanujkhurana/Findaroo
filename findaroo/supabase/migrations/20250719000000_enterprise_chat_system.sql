-- Enterprise Chat System Migration
-- This migration adds comprehensive notification system and enhances chat functionality

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'item_update', 'system', 'tip_received', 'karma_update')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for users
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Add push_token column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'push_token') THEN
        ALTER TABLE users ADD COLUMN push_token TEXT;
    END IF;
END $$;

-- Add read_at column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'read_at') THEN
        ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Create function to automatically create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for the receiver
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        NEW.receiver_id,
        'message',
        (SELECT full_name FROM users WHERE id = NEW.sender_id),
        NEW.message,
        jsonb_build_object(
            'itemId', NEW.item_id,
            'senderId', NEW.sender_id,
            'messageId', NEW.id,
            'senderName', (SELECT full_name FROM users WHERE id = NEW.sender_id)
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_message_notification();

-- Create function to create item status update notifications
CREATE OR REPLACE FUNCTION create_item_status_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notify all users who have messaged about this item
        INSERT INTO notifications (user_id, type, title, body, data)
        SELECT DISTINCT 
            CASE 
                WHEN m.sender_id = NEW.user_id THEN m.receiver_id
                ELSE m.sender_id
            END as user_id,
            'item_update',
            'Item Status Updated',
            'The status of "' || NEW.title || '" has been updated to ' || NEW.status,
            jsonb_build_object(
                'itemId', NEW.id,
                'oldStatus', OLD.status,
                'newStatus', NEW.status,
                'itemTitle', NEW.title
            )
        FROM messages m
        WHERE m.item_id = NEW.id
        AND CASE 
            WHEN m.sender_id = NEW.user_id THEN m.receiver_id
            ELSE m.sender_id
        END != NEW.user_id; -- Don't notify the item owner
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for item status notifications
DROP TRIGGER IF EXISTS trigger_item_status_notification ON items;
CREATE TRIGGER trigger_item_status_notification
    AFTER UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION create_item_status_notification();

-- Create function to create tip received notifications
CREATE OR REPLACE FUNCTION create_tip_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification when tip status changes to succeeded
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'succeeded' THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            NEW.receiver_id,
            'tip_received',
            'Tip Received!',
            'You received a $' || NEW.amount || ' tip from ' || (SELECT full_name FROM users WHERE id = NEW.sender_id),
            jsonb_build_object(
                'tipId', NEW.id,
                'amount', NEW.amount,
                'senderId', NEW.sender_id,
                'itemId', NEW.item_id,
                'senderName', (SELECT full_name FROM users WHERE id = NEW.sender_id)
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tip notifications
DROP TRIGGER IF EXISTS trigger_tip_notification ON tips;
CREATE TRIGGER trigger_tip_notification
    AFTER UPDATE ON tips
    FOR EACH ROW
    EXECUTE FUNCTION create_tip_notification();

-- Create function to create karma update notifications
CREATE OR REPLACE FUNCTION create_karma_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for karma changes
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        NEW.user_id,
        'karma_update',
        CASE 
            WHEN NEW.points > 0 THEN 'Karma Increased!'
            ELSE 'Karma Updated'
        END,
        'You ' || 
        CASE 
            WHEN NEW.points > 0 THEN 'gained ' || NEW.points || ' karma points'
            ELSE 'lost ' || ABS(NEW.points) || ' karma points'
        END ||
        ' for ' || NEW.action,
        jsonb_build_object(
            'karmaEventId', NEW.id,
            'points', NEW.points,
            'action', NEW.action,
            'itemId', NEW.item_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for karma notifications
DROP TRIGGER IF EXISTS trigger_karma_notification ON karma_events;
CREATE TRIGGER trigger_karma_notification
    AFTER INSERT ON karma_events
    FOR EACH ROW
    EXECUTE FUNCTION create_karma_notification();

-- Create function to clean up old notifications (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE id IN (
        SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM notifications
        ) ranked
        WHERE rn > 100
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
