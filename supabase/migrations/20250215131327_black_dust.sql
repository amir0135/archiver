/*
  # Clean database schema with optimized policies

  1. Tables
    - files: Store file metadata and user associations
    - file_shares: Manage file sharing between users
    - user_preferences: Store user UI preferences

  2. Security
    - RLS enabled on all tables
    - Optimized policies for file access and sharing
    - User-specific policies for preferences

  3. Performance
    - Proper indexes for common queries
    - Optimized file access checks
*/

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "files_insert" ON files;
DROP POLICY IF EXISTS "files_select" ON files;
DROP POLICY IF EXISTS "files_update" ON files;
DROP POLICY IF EXISTS "files_delete" ON files;
DROP POLICY IF EXISTS "file_shares_manage" ON file_shares;
DROP POLICY IF EXISTS "user_preferences_manage" ON user_preferences;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "files_insert"
ON files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "files_select"
ON files FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  id IN (
    SELECT file_id
    FROM file_shares
    WHERE shared_with = auth.uid()
  )
);

CREATE POLICY "files_update"
ON files FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "files_delete"
ON files FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- File shares policies
CREATE POLICY "file_shares_manage"
ON file_shares FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM files
    WHERE files.id = file_shares.file_id
    AND files.user_id = auth.uid()
  )
);

-- User preferences policies
CREATE POLICY "user_preferences_manage"
ON user_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();