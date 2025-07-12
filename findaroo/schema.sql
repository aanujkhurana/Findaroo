-- Enable PostGIS for location support
CREATE EXTENSION IF NOT EXISTS postgis;

-- USERS table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  email TEXT UNIQUE,
  profile_picture TEXT,
  phone TEXT,
  karma_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- ITEMS table (Lost or Found)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('lost', 'found', 'returned')) NOT NULL,
  category TEXT,
  title TEXT,
  description TEXT,
  image TEXT,
  location GEOGRAPHY(Point, 4326),
  location_name TEXT,
  reward_amount NUMERIC,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- MESSAGES table (chat per item between two users)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  message TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

-- KARMA EVENTS table (for building trust reputation)
CREATE TABLE IF NOT EXISTS karma_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT,
  points INTEGER,
  item_id UUID REFERENCES items(id),
  created_at TIMESTAMP DEFAULT now()
);

-- TIPS table (optional Stripe payments)
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  amount NUMERIC,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')),
  payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- CATEGORIES table (optional dropdown support)
CREATE TABLE IF NOT EXISTS item_categories (
  id SERIAL PRIMARY KEY,
  name TEXT
);

-- Seed some basic categories
INSERT INTO item_categories (name) VALUES
('wallet'),
('phone'),
('keys'),
('bag'),
('AirPods'),
('passport'),
('pet'),
('ID card'),
('laptop')
ON CONFLICT DO NOTHING;


-- RLS (Row Level Security) policies
-- Enable Row-Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Enable RLS for users table
-- Read/Update own user data
CREATE POLICY "Users can read their own profile"
ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE USING (auth.uid() = id);

-- Enable RLS for items table
-- Anyone can read items
CREATE POLICY "Public can read all items"
ON items FOR SELECT USING (true);

-- Only the owner can post a new item
CREATE POLICY "Users can insert their own items"
ON items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their items
CREATE POLICY "Users can update their own items"
ON items FOR UPDATE USING (auth.uid() = user_id);

-- Only the owner can delete their items
CREATE POLICY "Users can delete their own items"
ON items FOR DELETE USING (auth.uid() = user_id);


-- Enable RLS for messages table
-- Read own messages (sender or receiver)
CREATE POLICY "Users can read messages they're part of"
ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Send message if you're sender
CREATE POLICY "Users can insert messages as sender"
ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Karma events table
-- View your own karma events
CREATE POLICY "Users can view their own karma"
ON karma_events FOR SELECT USING (auth.uid() = user_id);

-- Optional: insert only if it's your own event
CREATE POLICY "Users can insert their own karma event"
ON karma_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tips table
-- View tips you sent or received
CREATE POLICY "Users can view tips they are part of"
ON tips FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Insert tips only if you're the sender
CREATE POLICY "Users can insert tips they send"
ON tips FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- IMAGES RLS 
-- INSERT: allow user to upload into their folder (user_id/filename)
CREATE POLICY "Allow user to upload item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- SELECT: allow user to read their own item images
CREATE POLICY "Allow user to read their item images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'item-images'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- DELETE: allow user to delete their own item images
CREATE POLICY "Allow user to delete their item images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images'
  AND auth.uid()::text = split_part(name, '/', 1)
);


-- Enable RLS for PROFILE pictures images
-- INSERT
CREATE POLICY "Allow user to upload profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- SELECT: Allow all authenticated users to read any profile picture
CREATE POLICY "Allow authenticated users to read profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures'
);

-- DELETE
CREATE POLICY "Allow user to delete their profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);
