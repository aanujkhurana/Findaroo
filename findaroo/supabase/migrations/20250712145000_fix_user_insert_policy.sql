-- Fix the INSERT policy for users table to handle UUID type casting correctly

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create the corrected policy with proper UUID type casting
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);
