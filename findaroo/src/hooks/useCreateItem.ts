import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Item, LocationCoords, Category } from '../types';

export const useCreateItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (itemData: {
    title: string;
    description: string;
    category: Category;
    status: 'lost' | 'found';
    location: LocationCoords;
    image?: string;
    reward_amount?: number;
    user_id: string;
    resolved: boolean;
  }): Promise<Item | null> => {
    try {
      setLoading(true);
      setError(null);

      // Convert location to PostGIS format
      let postgisLocation = null;
      if (itemData.location && itemData.location.latitude && itemData.location.longitude) {
        // Convert to PostGIS POINT format: POINT(longitude latitude)
        postgisLocation = `POINT(${itemData.location.longitude} ${itemData.location.latitude})`;
      }

      const { data, error } = await supabase
        .from('items')
        .insert([{
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          status: itemData.status,
          location: postgisLocation,
          location_name: itemData.location?.address || null,
          image: itemData.image,
          reward_amount: itemData.reward_amount,
          user_id: itemData.user_id,
          resolved: itemData.resolved,
        }])
        .select(`
          *,
          user:users(id, full_name, profile_pic)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error creating item:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createItem,
    loading,
    error,
  };
}; 