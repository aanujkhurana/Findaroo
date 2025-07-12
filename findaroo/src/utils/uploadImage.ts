import { supabase } from '../services/supabaseClient';
import * as FileSystem from 'expo-file-system';
import mime from 'mime'; // <-- Add this import (install with: npm install mime)

export const uploadImage = async (uri: string, filename: string, userId: string, bucket: string = 'item-images'): Promise<string | null> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('[uploadImage] File info:', fileInfo);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Create file name with userId prefix
    const filePath = `${userId}/${Date.now()}_${filename}`;
    console.log('[uploadImage] filePath:', filePath);
    
    // Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('[uploadImage] Blob type:', blob.type, 'Blob size:', blob.size);

    // Detect content type from filename
    const contentType = mime.getType(filename) || 'application/octet-stream';
    console.log('[uploadImage] Detected contentType:', contentType);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType, // Use detected content type
        upsert: false
      });
    console.log('[uploadImage] Supabase upload response:', { data, error });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

export const getImageUrl = (path: string, bucket: string = 'item-images'): string => {
  if (!path) return '';
  // NOTE: If your bucket is private, use createSignedUrl instead of getPublicUrl
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
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
