/*
  # Fix tags and add sidebar state

  1. Changes
    - Add GIN index for efficient tag searching
    - Add user preferences table for sidebar state
    - Update file tags handling

  2. Security
    - Enable RLS on user preferences
    - Add policies for user preferences
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  sidebar_expanded boolean DEFAULT true,
  insights_expanded boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can manage their preferences"
ON user_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add GIN index for tags if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING gin(tags);

-- Add trigger to update user_preferences.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();