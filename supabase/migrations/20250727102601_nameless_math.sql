/*
  # Fix profiles table RLS policies

  1. Security
    - Add policy for authenticated users to insert their own profile
    - Ensure users can only create profiles for their own user ID
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);