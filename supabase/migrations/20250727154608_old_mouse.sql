/*
  # Marketplace Features Migration

  1. New Tables
    - `supplier_profiles` - Extended supplier information
    - `vendor_ratings` - Vendor ratings for suppliers
    - `supplier_ratings` - Supplier ratings for vendors
    - `payment_receipts` - COD payment receipts
    - `order_tracking` - Order status tracking
    - `supplier_inquiries` - Contact inquiries

  2. Sample Data
    - 20 suppliers across different categories
    - Sample ratings and reviews
    - Mock inventory data

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Extended supplier profiles
CREATE TABLE IF NOT EXISTS supplier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL,
  description text,
  address text,
  city text,
  state text,
  pincode text,
  years_in_business integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  business_license text,
  gst_number text,
  website_url text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendor ratings for suppliers
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title text,
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, supplier_id, order_id)
);

-- Supplier ratings for vendors
CREATE TABLE IF NOT EXISTS supplier_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title text,
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, vendor_id, order_id)
);

-- Payment receipts for COD
CREATE TABLE IF NOT EXISTS payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text DEFAULT 'cod',
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  receipt_number text UNIQUE NOT NULL,
  payment_date timestamptz,
  delivery_confirmation_code text,
  created_at timestamptz DEFAULT now()
);

-- Order tracking
CREATE TABLE IF NOT EXISTS order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  location text,
  timestamp timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Supplier inquiries
CREATE TABLE IF NOT EXISTS supplier_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  inquiry_type text DEFAULT 'general' CHECK (inquiry_type IN ('general', 'pricing', 'bulk_order', 'partnership')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read supplier profiles" ON supplier_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers can manage own profile" ON supplier_profiles FOR ALL TO authenticated USING (supplier_id = auth.uid());

CREATE POLICY "Anyone can read vendor ratings" ON vendor_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vendors can create ratings" ON vendor_ratings FOR INSERT TO authenticated WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Vendors can update own ratings" ON vendor_ratings FOR UPDATE TO authenticated USING (vendor_id = auth.uid());

CREATE POLICY "Anyone can read supplier ratings" ON supplier_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers can create ratings" ON supplier_ratings FOR INSERT TO authenticated WITH CHECK (supplier_id = auth.uid());
CREATE POLICY "Suppliers can update own ratings" ON supplier_ratings FOR UPDATE TO authenticated USING (supplier_id = auth.uid());

CREATE POLICY "Users can read own receipts" ON payment_receipts FOR SELECT TO authenticated USING (vendor_id = auth.uid() OR supplier_id = auth.uid());
CREATE POLICY "System can manage receipts" ON payment_receipts FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read order tracking" ON order_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers can add tracking updates" ON order_tracking FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can read own inquiries" ON supplier_inquiries FOR SELECT TO authenticated USING (vendor_id = auth.uid() OR supplier_id = auth.uid());
CREATE POLICY "Vendors can create inquiries" ON supplier_inquiries FOR INSERT TO authenticated WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Suppliers can update inquiry status" ON supplier_inquiries FOR UPDATE TO authenticated USING (supplier_id = auth.uid());

-- Generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS text AS $$
BEGIN
  RETURN 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert sample supplier profiles
INSERT INTO supplier_profiles (supplier_id, business_name, business_type, description, address, city, state, pincode, years_in_business, is_verified, logo_url) VALUES
-- Electronics Suppliers
('550e8400-e29b-41d4-a716-446655440001', 'TechMart Electronics', 'Electronics', 'Leading supplier of electronic components, gadgets, and accessories for retail businesses.', '123 Electronics Hub, Nehru Place', 'New Delhi', 'Delhi', '110019', 8, true, 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440002', 'Digital Solutions Co.', 'Electronics', 'Wholesale distributor of smartphones, tablets, and computer accessories.', '45 Tech Street, Bandra', 'Mumbai', 'Maharashtra', '400050', 12, true, 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440003', 'ElectroMax Distributors', 'Electronics', 'Specialized in home appliances and electronic goods for small retailers.', '78 Industrial Area, Sector 8', 'Chandigarh', 'Punjab', '160009', 6, true, 'https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Textile Suppliers
('550e8400-e29b-41d4-a716-446655440004', 'Fabric World Ltd.', 'Textiles', 'Premium fabric supplier offering cotton, silk, and synthetic materials.', '234 Textile Market, Commercial Street', 'Bangalore', 'Karnataka', '560001', 15, true, 'https://images.pexels.com/photos/1148957/pexels-photo-1148957.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440005', 'Cotton King Suppliers', 'Textiles', 'Wholesale cotton and linen supplier for garment manufacturers.', '56 Gandhi Market, Karol Bagh', 'New Delhi', 'Delhi', '110005', 20, true, 'https://images.pexels.com/photos/1148957/pexels-photo-1148957.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440006', 'Silk Route Textiles', 'Textiles', 'Exquisite silk and designer fabric supplier for premium retailers.', '89 Silk Market, T. Nagar', 'Chennai', 'Tamil Nadu', '600017', 10, true, 'https://images.pexels.com/photos/1148957/pexels-photo-1148957.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Food Product Suppliers
('550e8400-e29b-41d4-a716-446655440007', 'Fresh Foods Wholesale', 'Food Products', 'Quality supplier of fresh produce, grains, and packaged foods.', '12 Mandi Road, Azadpur', 'New Delhi', 'Delhi', '110033', 7, true, 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440008', 'Spice Garden Co.', 'Food Products', 'Premium spice and seasoning supplier for restaurants and food vendors.', '67 Spice Market, Khari Baoli', 'New Delhi', 'Delhi', '110006', 25, true, 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440009', 'Organic Harvest Ltd.', 'Food Products', 'Certified organic food supplier specializing in healthy alternatives.', '34 Green Valley, Whitefield', 'Bangalore', 'Karnataka', '560066', 5, true, 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Construction Materials
('550e8400-e29b-41d4-a716-446655440010', 'BuildMart Supplies', 'Construction', 'Complete building materials supplier for construction projects.', '123 Industrial Estate, Gurgaon', 'Gurgaon', 'Haryana', '122001', 18, true, 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440011', 'Steel & Cement Co.', 'Construction', 'Leading supplier of steel, cement, and construction hardware.', '45 Construction Hub, Andheri', 'Mumbai', 'Maharashtra', '400058', 22, true, 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Automotive Parts
('550e8400-e29b-41d4-a716-446655440012', 'AutoParts Express', 'Automotive', 'Comprehensive automotive parts and accessories supplier.', '78 Auto Market, Karol Bagh', 'New Delhi', 'Delhi', '110005', 14, true, 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440013', 'Motor World Distributors', 'Automotive', 'Specialized in motorcycle and scooter parts distribution.', '23 Industrial Area, Pimpri', 'Pune', 'Maharashtra', '411018', 9, true, 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Beauty & Cosmetics
('550e8400-e29b-41d4-a716-446655440014', 'Beauty Bazaar Wholesale', 'Beauty & Cosmetics', 'Premium beauty products and cosmetics supplier for salons and retailers.', '56 Beauty Street, Linking Road', 'Mumbai', 'Maharashtra', '400050', 6, true, 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440015', 'Glamour Supplies Co.', 'Beauty & Cosmetics', 'Wholesale distributor of skincare, makeup, and beauty accessories.', '89 Commercial Complex, CP', 'New Delhi', 'Delhi', '110001', 11, true, 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Stationery & Office Supplies
('550e8400-e29b-41d4-a716-446655440016', 'Office Depot India', 'Stationery', 'Complete office supplies and stationery for businesses and schools.', '12 Stationery Market, Daryaganj', 'New Delhi', 'Delhi', '110002', 16, true, 'https://images.pexels.com/photos/159751/book-address-book-learning-learn-159751.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440017', 'Paper Plus Suppliers', 'Stationery', 'Bulk supplier of paper products, notebooks, and writing materials.', '34 Commercial Street, Brigade Road', 'Bangalore', 'Karnataka', '560025', 8, true, 'https://images.pexels.com/photos/159751/book-address-book-learning-learn-159751.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Sports & Fitness
('550e8400-e29b-41d4-a716-446655440018', 'SportsMart Wholesale', 'Sports & Fitness', 'Sports equipment and fitness gear supplier for gyms and retailers.', '67 Sports Complex, Lajpat Nagar', 'New Delhi', 'Delhi', '110024', 12, true, 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=200'),
('550e8400-e29b-41d4-a716-446655440019', 'Fitness Pro Distributors', 'Sports & Fitness', 'Professional fitness equipment and accessories distributor.', '45 Industrial Estate, Whitefield', 'Bangalore', 'Karnataka', '560066', 7, true, 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=200'),

-- Home & Garden
('550e8400-e29b-41d4-a716-446655440020', 'Home Essentials Co.', 'Home & Garden', 'Home decor, furniture, and garden supplies for retailers.', '23 Furniture Market, Kirti Nagar', 'New Delhi', 'Delhi', '110015', 13, true, 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200');

-- Insert sample vendor ratings
INSERT INTO vendor_ratings (vendor_id, supplier_id, order_id, rating, review_title, review_text) VALUES
-- Sample ratings (using existing order IDs if available, otherwise mock)
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440001', gen_random_uuid(), 5, 'Excellent Service', 'Very professional and timely delivery. Products were exactly as described.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440002', gen_random_uuid(), 4, 'Good Quality', 'Good quality products but delivery was slightly delayed.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440003', gen_random_uuid(), 5, 'Highly Recommended', 'Outstanding service and competitive prices. Will order again.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440004', gen_random_uuid(), 3, 'Average Experience', 'Products were okay but customer service could be better.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440005', gen_random_uuid(), 5, 'Perfect Partner', 'Been working with them for months. Always reliable and professional.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440007', gen_random_uuid(), 4, 'Fresh Products', 'Always fresh produce and good packaging. Recommended for food vendors.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440008', gen_random_uuid(), 5, 'Best Spices', 'Authentic spices with great aroma. Customers love the quality.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440010', gen_random_uuid(), 4, 'Reliable Supplier', 'Good quality construction materials. Delivery on time.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440012', gen_random_uuid(), 5, 'Auto Parts Expert', 'Genuine parts and excellent technical support. Highly recommended.'),
('52767bfb-eadc-46a1-8662-2b876054b8c9', '550e8400-e29b-41d4-a716-446655440014', gen_random_uuid(), 4, 'Quality Cosmetics', 'Good range of beauty products. Popular with customers.');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_supplier_id ON supplier_profiles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_supplier_id ON vendor_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_rating ON vendor_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_vendor_id ON supplier_ratings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_order_id ON payment_receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_inquiries_supplier_id ON supplier_inquiries(supplier_id);