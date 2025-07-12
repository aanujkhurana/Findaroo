-- Create the profile-pics bucket if it doesn't exist
-- This bucket is for user profile pictures as specified in DatabaseReadme.md

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pics', 'profile-pics', false)
ON CONFLICT (id) DO NOTHING;

-- Ensure the policies exist for the bucket
-- (These should already exist from the previous migration, but let's make sure)

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow user to upload profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to delete their profile picture" ON storage.objects;

-- INSERT: allow user to upload into their folder (user_id/filename)
CREATE POLICY "Allow user to upload profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pics'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- SELECT: Allow all authenticated users to read any profile picture
CREATE POLICY "Allow authenticated users to read profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pics'
);

-- DELETE: allow user to delete their own profile picture
CREATE POLICY "Allow user to delete their profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pics'
  AND auth.uid()::text = split_part(name, '/', 1)
);
