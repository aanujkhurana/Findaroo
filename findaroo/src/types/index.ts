export interface User {
  id: string;
  email: string;
  full_name: string;
  profile_picture?: string;
  avatar_url?: string;
  karma?: number;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'lost' | 'found';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_resolved: boolean;
  reward_amount?: number;
  user?: User;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  item_id: string;
  created_at: string;
  sender?: User;
  recipient?: User;
}

export interface ChatThread {
  id: string;
  item_id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message?: Message;
  created_at: string;
  updated_at: string;
  item?: Item;
  participant_1?: User;
  participant_2?: User;
}

export interface KarmaEvent {
  id: string;
  user_id: string;
  points: number;
  event_type: 'item_posted' | 'item_found' | 'item_returned' | 'tip_received';
  description: string;
  created_at: string;
}

export type Category = 
  | 'electronics'
  | 'clothing'
  | 'accessories'
  | 'documents'
  | 'keys'
  | 'bags'
  | 'pets'
  | 'jewelry'
  | 'sports'
  | 'other';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}
