-- Final comprehensive fix for profile-pics bucket and policies
-- This ensures the bucket exists and has the correct policies

-- First, ensure the bucket exists (using INSERT with ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pics', 
  'profile-pics', 
  false, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop ALL existing storage policies to start fresh
DROP POLICY IF EXISTS "Allow user to upload profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to delete their profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to read their item images" ON storage.objects;
DROP POLICY IF EXISTS "Allow user to delete their item images" ON storage.objects;

-- Create comprehensive storage policies for both buckets

-- PROFILE-PICS BUCKET POLICIES
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

-- UPDATE: allow user to update their own profile picture
CREATE POLICY "Allow user to update their profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pics'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- DELETE: allow user to delete their own profile picture
CREATE POLICY "Allow user to delete their profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pics'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- ITEM-IMAGES BUCKET POLICIES (recreate them too)
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

-- UPDATE: allow user to update their own item images
CREATE POLICY "Allow user to update their item images"
ON storage.objects FOR UPDATE
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
