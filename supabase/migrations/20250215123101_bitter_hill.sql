/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Remove circular dependencies in policy conditions
    - Optimize query performance
    - Add proper indexes

  2. Security
    - Maintain secure access control
    - Ensure proper file ownership checks
    - Preserve sharing functionality
*/

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own files" ON files;
DROP POLICY IF EXISTS "Users can view own files" ON files;
DROP POLICY IF EXISTS "Users can view shared files" ON files;
DROP POLICY IF EXISTS "Users can update own files" ON files;
DROP POLICY IF EXISTS "Users can delete own files" ON files;

-- Simple, non-recursive policies
CREATE POLICY "insert_policy"
ON files FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "select_own_policy"
ON files FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "select_shared_policy"
ON files FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT file_id 
    FROM file_shares 
    WHERE shared_with = auth.uid()
  )
);

CREATE POLICY "update_policy"
ON files FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_policy"
ON files FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);