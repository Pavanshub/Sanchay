/*
  # Initial Schema for Sanchay Platform

  1. New Tables
    - `profiles` - User profiles for vendors and suppliers
    - `clusters` - Location-based vendor clusters
    - `cluster_members` - Junction table for cluster membership
    - `categories` - Product categories
    - `inventory` - Supplier inventory items
    - `bulk_tiers` - Pricing tiers for bulk orders
    - `orders` - Group orders
    - `order_items` - Individual items in orders
    - `order_participants` - Vendors participating in group orders
    - `reviews` - Vendor reviews for suppliers

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('vendor', 'supplier');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE cluster_status AS ENUM ('active', 'inactive');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  location jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clusters table
CREATE TABLE IF NOT EXISTS clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pincode text NOT NULL,
  center_location jsonb NOT NULL,
  radius_km integer DEFAULT 5,
  status cluster_status DEFAULT 'active',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cluster members junction table
CREATE TABLE IF NOT EXISTS cluster_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES clusters(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(cluster_id, vendor_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_hindi text,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  name_hindi text,
  description text,
  photo_url text,
  unit text NOT NULL DEFAULT 'kg',
  base_price decimal(10,2) NOT NULL,
  minimum_quantity integer DEFAULT 1,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bulk tiers table
CREATE TABLE IF NOT EXISTS bulk_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL,
  price_per_unit decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES clusters(id),
  supplier_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  total_amount decimal(10,2) DEFAULT 0,
  status order_status DEFAULT 'pending',
  delivery_date date,
  delivery_slot text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES inventory(id),
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Order participants table
CREATE TABLE IF NOT EXISTS order_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES profiles(id),
  items jsonb NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  vendor_id uuid REFERENCES profiles(id),
  supplier_id uuid REFERENCES profiles(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can read clusters"
  ON clusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can create clusters"
  ON clusters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

CREATE POLICY "Anyone can read cluster members"
  ON cluster_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can join clusters"
  ON cluster_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can manage own inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Anyone can read bulk tiers"
  ON bulk_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can manage bulk tiers for own inventory"
  ON bulk_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory 
      WHERE id = inventory_id AND supplier_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

CREATE POLICY "Anyone can read order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read order participants"
  ON order_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can participate in orders"
  ON order_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

-- Insert sample categories
INSERT INTO categories (name, name_hindi, description, icon) VALUES
('Vegetables', 'सब्जियां', 'Fresh vegetables and greens', '🥬'),
('Spices', 'मसाले', 'Indian spices and seasonings', '🌶️'),
('Grains & Pulses', 'अनाज और दाल', 'Rice, wheat, lentils and pulses', '🌾'),
('Oil & Ghee', 'तेल और घी', 'Cooking oils and ghee', '🫒'),
('Dairy', 'डेयरी', 'Milk, butter, cheese and dairy products', '🥛'),
('Meat & Fish', 'मांस और मछली', 'Fresh meat and fish', '🐟'),
('Packaging', 'पैकेजिंग', 'Food packaging materials', '📦');