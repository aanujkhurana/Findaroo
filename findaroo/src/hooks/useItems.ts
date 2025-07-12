import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Item, Category, LocationCoords } from '../types';
import { getCurrentLocation, filterItemsByDistance, sortItemsByDistance, formatDistance } from '../utils/location';

interface ItemFilters {
  status?: 'lost' | 'found';
  category?: Category;
  search?: string;
  userId?: string;
  maxDistance?: number; // in kilometers
  sortByDistance?: boolean;
}

// Utility to parse PostGIS POINT string to { latitude, longitude, address }
function parsePointString(pointStr: string | undefined, address?: string): { latitude: number; longitude: number; address?: string } | undefined {
  if (!pointStr || typeof pointStr !== 'string') return undefined;
  const match = pointStr.match(/POINT\((-?\d+\.\d+) (-?\d+\.\d+)\)/);
  if (match) {
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
      address,
    };
  }
  return undefined;
}

export const useItems = (filters: ItemFilters = {}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);

  // Get user location for distance calculations
  useEffect(() => {
    const getUserLocation = async () => {
      if (filters.maxDistance || filters.sortByDistance) {
        console.log('[useItems] Getting user location for distance filtering...');
        const location = await getCurrentLocation();
        setUserLocation(location);
      }
    };
    getUserLocation();
  }, [filters.maxDistance, filters.sortByDistance]);

  useEffect(() => {
    console.log('[useItems] Filters changed:', filters);
    fetchItems();
  }, [filters, userLocation]);

  const fetchItems = async () => {
    console.log('[useItems] Fetching items with filters:', filters);
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('items')
        .select(`
          *,
          user:users(id, full_name, profile_pic),
          tips:tips(id, amount, status, created_at, sender_id, receiver_id, payment_intent_id)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      console.log('[useItems] Supabase response:', { data, error });

      if (error) throw error;

      // Debug raw location data
      if (data && data.length > 0) {
        console.log('[useItems] Sample item raw location:', data[0].location);
        console.log('[useItems] Sample item location_name:', data[0].location_name);
      }

      // Normalize location field for all items
      let processedItems = (data || []).map(item => {
        const parsedLocation = parsePointString(item.location, item.location_name);
        console.log('[useItems] Raw location:', item.location, 'Parsed:', parsedLocation);
        return {
          ...item,
          location: parsedLocation,
        };
      });

      // Apply distance-based filtering and sorting if user location is available
      if (userLocation && processedItems.length > 0) {
        console.log('[useItems] Applying distance-based filtering/sorting...');

        // Filter by distance if maxDistance is specified
        if (filters.maxDistance) {
          processedItems = filterItemsByDistance(processedItems, userLocation, filters.maxDistance);
          console.log(`[useItems] Filtered to ${processedItems.length} items within ${filters.maxDistance}km`);
        }

        // Sort by distance if requested
        if (filters.sortByDistance) {
          processedItems = sortItemsByDistance(processedItems, userLocation);
          console.log('[useItems] Sorted items by distance');
        }
      }

      setItems(processedItems);
    } catch (err: any) {
      setError(err.message);
      console.error('[useItems] Error fetching items:', err);
    } finally {
      setLoading(false);
      console.log('[useItems] Fetch complete. Loading set to false.');
    }
  };

  const createItem = async (itemData: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'user'>): Promise<Item | null> => {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([itemData])
        .select(`
          *,
          user:users(id, full_name, profile_pic)
        `)
        .single();

      if (error) throw error;

      // Optimistically update local state
      setItems(prevItems => [data, ...prevItems]);

      return data;
    } catch (error: any) {
      console.error('Error creating item:', error);
      setError(error.message);
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>): Promise<Item | null> => {
    try {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          user:users(id, full_name, profile_pic)
        `)
        .single();

      if (error) throw error;

      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, ...data } : item
        )
      );

      return data;
    } catch (error: any) {
      console.error('Error updating item:', error);
      setError(error.message);
      return null;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setItems(prevItems => prevItems.filter(item => item.id !== id));

      return true;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      setError(error.message);
      return false;
    }
  };

  const markAsResolved = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ resolved: true })
        .eq('id', id);

      if (error) throw error;

      // Remove from local state since we only show unresolved items
      setItems(prevItems => prevItems.filter(item => item.id !== id));

      return true;
    } catch (error: any) {
      console.error('Error marking item as resolved:', error);
      setError(error.message);
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    userLocation,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    markAsResolved,
  };
};
