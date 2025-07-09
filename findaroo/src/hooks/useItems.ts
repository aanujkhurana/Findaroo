import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Item, Category } from '../types';

interface ItemFilters {
  status?: 'lost' | 'found';
  category?: Category;
  search?: string;
  userId?: string;
}

export const useItems = (filters: ItemFilters = {}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('items')
        .select(`
          *,
          user:users(id, full_name, profile_pic)
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

      if (error) throw error;

      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
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
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    markAsResolved,
  };
};
