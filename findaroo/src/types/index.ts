export interface User {
  id: string;
  email: string;
  full_name: string;
  profile_pic?: string;
  karma_points?: number;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Tip {
  id: string;
  item_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  payment_intent_id?: string;
  created_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'lost' | 'found' | 'returned';
  location?: string; // PostGIS geometry string
  location_name?: string; // Human-readable location name
  image?: string; // Changed from image_url to match database schema
  user_id: string;
  created_at: string;
  updated_at: string;
  resolved: boolean;
  reward_amount?: number;
  user?: User;
  tips?: Tip[];
}

export interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  item_id: string;
  sent_at: string;
  sender?: User;
  receiver?: User;
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
