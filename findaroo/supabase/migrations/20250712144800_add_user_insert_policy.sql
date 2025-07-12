-- Add missing INSERT policy for users table
-- This allows users to create their own profile when they sign up

CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (auth.uid()::text = id::text);
