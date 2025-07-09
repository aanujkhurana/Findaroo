import { supabase } from '../services/supabaseClient';
import * as FileSystem from 'expo-file-system';

export const uploadImage = async (uri: string, path: string, bucket: string = 'item-images'): Promise<string | null> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Create file name with timestamp to avoid conflicts
    const fileName = `${Date.now()}_${path}`;
    
    // Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

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
