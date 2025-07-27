import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  role: 'vendor' | 'supplier';
  name: string;
  phone: string;
  location?: any;
  created_at: string;
  updated_at: string;
};

export type Cluster = {
  id: string;
  name: string;
  pincode: string;
  center_location: any;
  radius_km: number;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  name_hindi?: string;
  description?: string;
  icon?: string;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  supplier_id: string;
  category_id: string;
  name: string;
  name_hindi?: string;
  description?: string;
  photo_url?: string;
  unit: string;
  base_price: number;
  minimum_quantity: number;
  available: boolean;
  created_at: string;
  updated_at: string;
  bulk_tiers?: BulkTier[];
};

export type BulkTier = {
  id: string;
  inventory_id: string;
  min_quantity: number;
  price_per_unit: number;
  created_at: string;
};

export type Order = {
  id: string;
  cluster_id: string;
  supplier_id: string;
  title: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_date?: string;
  delivery_slot?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};