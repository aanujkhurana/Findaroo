-- Fix profile picture bucket name inconsistency
-- DatabaseReadme.md specifies 'profile-pics' but code uses 'profile-pictures'
-- Let's standardize on 'profile-pics' as per the specification

-- First, drop existing policies for 'profile-pictures'
DROP POLICY IF EXISTS "Allow user to upload profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to delete their profile picture" ON storage.objects;

-- Create policies for the correct bucket name 'profile-pics'
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
