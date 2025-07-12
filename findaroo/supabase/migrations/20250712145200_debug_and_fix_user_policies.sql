-- Debug and fix user table RLS policies

-- First, let's see what policies exist
-- DROP ALL existing policies for users table to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create comprehensive policies for users table
-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
ON users FOR SELECT 
USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE 
USING (auth.uid()::text = id::text);

-- Allow users to insert their own profile (this is the key one that was missing)
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);

-- Also allow public read access to basic user info (needed for showing item owners)
CREATE POLICY "Public can read basic user info"
ON users FOR SELECT 
USING (true);
