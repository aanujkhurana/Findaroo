import { supabase } from '../services/supabaseClient';
import * as FileSystem from 'expo-file-system';
import mime from 'mime'; // <-- Add this import (install with: npm install mime)

export const uploadImage = async (uri: string, filename: string, userId: string, bucket: string = 'item-images'): Promise<string | null> => {
  try {
    console.log('[uploadImage] Starting upload process for:', filename);

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('[uploadImage] File info:', fileInfo);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Validate file size (max 10MB)
    if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Create file name with userId prefix and ensure unique filename
    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_'); // Clean filename
    const filePath = `${userId}/${timestamp}_${cleanFilename}`;
    console.log('[uploadImage] filePath:', filePath);

    // Detect content type from filename
    const contentType = mime.getType(filename) || 'image/jpeg';
    console.log('[uploadImage] Detected contentType:', contentType);

    // Validate content type
    if (!contentType.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // Read file as base64 for React Native compatibility
    console.log('[uploadImage] Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[uploadImage] File read successfully, size:', base64.length, 'characters');

    // Convert base64 to blob for upload
    const response = await fetch(`data:${contentType};base64,${base64}`);
    const blob = await response.blob();

    console.log('[uploadImage] Blob created, size:', blob.size, 'bytes');

    // Upload to Supabase Storage using blob
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType,
        upsert: true
      });

    console.log('[uploadImage] Supabase upload response:', { data, error });

    if (error) {
      console.error('[uploadImage] Supabase error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('Upload succeeded but no path returned');
    }

    console.log('[uploadImage] Upload successful, path:', data.path);
    return data.path;
  } catch (error: any) {
    console.error('[uploadImage] Error:', error);
    return null;
  }
};

export const getImageUrl = (path: string, bucket: string = 'item-images'): string => {
  if (!path) return '';
  
  try {
    // Clean the path
    const cleanPath = path.trim();
    console.log(`[getImageUrl] Getting public URL for path: ${cleanPath} from bucket: ${bucket}`);
    
    // NOTE: For private buckets, use createSignedUrl instead of getPublicUrl
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(cleanPath);
    
    if (!data?.publicUrl) {
      console.error(`[getImageUrl] No public URL returned for ${cleanPath}`);
      return '';
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('[getImageUrl] Error getting public URL:', error);
    return '';
  }
};

// Get a signed URL for private buckets with improved error handling
export const getSignedImageUrl = async (path: string, bucket: string = 'item-images'): Promise<string> => {
  if (!path) return '';
  
  try {
    // Ensure path is properly formatted
    const cleanPath = path.trim();
    console.log(`[getSignedImageUrl] Getting signed URL for path: ${cleanPath} from bucket: ${bucket}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 60 * 60); // 1 hour expiry
    
    if (error) {
      console.error(`[getSignedImageUrl] Error creating signed URL for ${cleanPath}:`, error);
      return '';
    }
    
    if (!data?.signedUrl) {
      console.error(`[getSignedImageUrl] No signed URL returned for ${cleanPath}`);
      return '';
    }
    
    console.log(`[getSignedImageUrl] Successfully generated signed URL for ${cleanPath}`);
    return data.signedUrl;
  } catch (error) {
    console.error('[getSignedImageUrl] Unexpected error:', error);
    return '';
  }
};

export const deleteImage = async (path: string, bucket: string = 'item-images'): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};
