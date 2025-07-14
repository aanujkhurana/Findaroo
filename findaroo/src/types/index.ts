export interface User {
  id: string;
  email: string;
  full_name: string;
  profile_pic?: string;
  karma_points?: number;
  phone?: string;
  push_token?: string;
  created_at: string;
  // Note: removed updated_at as it's not in the DatabaseReadme.md spec
}

export interface Tip {
  id: string;
  item_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed'; // Updated to match DatabaseReadme.md spec
  payment_intent_id?: string;
  created_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'lost' | 'found' | 'returned' | 'kept' | 'claimed' | 'flagged' | 'duplicate'; // Updated to match DatabaseReadme.md spec
  location?: string; // PostGIS geometry string
  location_name?: string; // Human-readable location name
  image?: string; // Storage path (e.g. userId/image.jpg)
  user_id: string;
  created_at: string;
  // Note: removed updated_at as it's not in the DatabaseReadme.md spec
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
  read_at?: string;
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
  item_id?: string; // Optional reference to item, as per DatabaseReadme.md spec
  action: string; // Changed from event_type to action to match DatabaseReadme.md spec
  points: number;
  created_at: string;
  // Note: removed description as it's not in the DatabaseReadme.md spec
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
