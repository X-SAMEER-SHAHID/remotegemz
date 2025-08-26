/*
  # Programming Work Tracker Schema

  1. New Tables
    - `work_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `work_date` (date)
      - `work_time` (time)
      - `description` (text)
      - `hours_spent` (decimal)
      - `commit_link` (text, optional)
      - `screenshot_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `work_entries` table
    - Add policies for authenticated users to manage their own entries
*/

CREATE TABLE IF NOT EXISTS work_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  work_date date NOT NULL,
  work_time time NOT NULL,
  description text NOT NULL,
  hours_spent decimal(4,2) NOT NULL CHECK (hours_spent > 0),
  commit_link text,
  screenshot_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own work entries
CREATE POLICY "Users can read own work entries"
  ON work_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own work entries
CREATE POLICY "Users can insert own work entries"
  ON work_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own work entries
CREATE POLICY "Users can update own work entries"
  ON work_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own work entries
CREATE POLICY "Users can delete own work entries"
  ON work_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS work_entries_user_date_idx ON work_entries(user_id, work_date);
CREATE INDEX IF NOT EXISTS work_entries_user_created_idx ON work_entries(user_id, created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_work_entries_updated_at
  BEFORE UPDATE ON work_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();