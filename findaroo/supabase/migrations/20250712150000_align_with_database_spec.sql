-- Align database with DatabaseReadme.md specification
-- This migration brings the database in line with the documented schema

-- First, let's update the items table to match the spec
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;

-- Update the status constraint to include all specified statuses
ALTER TABLE items 
DROP CONSTRAINT IF EXISTS items_status_check;

ALTER TABLE items 
ADD CONSTRAINT items_status_check 
CHECK (status IN ('lost', 'found', 'returned', 'kept', 'claimed', 'flagged', 'duplicate'));

-- Ensure the users table has the correct field name (profile_pic not profile_picture)
-- The migration schema already has profile_pic, so this is just for consistency

-- Add performance indexes as specified in the documentation
CREATE INDEX IF NOT EXISTS idx_items_location ON items USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- Add indexes for other frequently queried fields
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_karma_events_user_id ON karma_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_item_id ON tips(item_id);

-- Update RLS policies to be comprehensive as per spec
-- Items table policies (already mostly correct, but let's ensure completeness)
DROP POLICY IF EXISTS "Public can read all items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;

-- Items: Public read access for the feed
CREATE POLICY "Public can read all items"
ON items FOR SELECT 
USING (true);

-- Items: Users can only insert their own items
CREATE POLICY "Users can insert their own items"
ON items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Items: Users can only update their own items
CREATE POLICY "Users can update their own items"
ON items FOR UPDATE 
USING (auth.uid() = user_id);

-- Items: Users can only delete their own items
CREATE POLICY "Users can delete their own items"
ON items FOR DELETE 
USING (auth.uid() = user_id);

-- Messages table policies (ensure they're comprehensive)
DROP POLICY IF EXISTS "Users can read messages they're part of" ON messages;
DROP POLICY IF EXISTS "Users can insert messages as sender" ON messages;

CREATE POLICY "Users can read messages they're part of"
ON messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages as sender"
ON messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Karma events policies
DROP POLICY IF EXISTS "Users can view their own karma" ON karma_events;
DROP POLICY IF EXISTS "Users can insert their own karma event" ON karma_events;

CREATE POLICY "Users can view their own karma"
ON karma_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own karma event"
ON karma_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tips table policies
DROP POLICY IF EXISTS "Users can view tips they are part of" ON tips;
DROP POLICY IF EXISTS "Users can insert tips they send" ON tips;

CREATE POLICY "Users can view tips they are part of"
ON tips FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert tips they send"
ON tips FOR INSERT 
WITH CHECK (auth.uid() = sender_id);
