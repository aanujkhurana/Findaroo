-- Fix profile picture RLS policy to allow reading other users' profile pictures
-- This is needed for ItemDetailsScreen to show profile pictures of item owners

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow user to read their profile picture" ON storage.objects;

-- Create a new policy that allows all authenticated users to read any profile picture
CREATE POLICY "Allow authenticated users to read profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures'
);