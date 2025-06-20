/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Drop existing policies
    - Create new optimized policies with proper joins
    - Add indexes for better performance
    - Update schema to include missing columns

  2. Security
    - Maintain secure access control
    - Prevent infinite recursion
    - Ensure proper file ownership checks
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'tags') 
  THEN
    ALTER TABLE files ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'folder') 
  THEN
    ALTER TABLE files ADD COLUMN folder uuid DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'metadata') 
  THEN
    ALTER TABLE files ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own files" ON files;
DROP POLICY IF EXISTS "Users can view files" ON files;
DROP POLICY IF EXISTS "Users can update own files" ON files;
DROP POLICY IF EXISTS "Users can delete own files" ON files;

-- Create new optimized policies
CREATE POLICY "Users can insert their own files"
ON files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own files"
ON files FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view shared files"
ON files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM file_shares 
    WHERE file_shares.file_id = id 
    AND file_shares.shared_with = auth.uid()
  )
);

CREATE POLICY "Users can update own files"
ON files FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own files"
ON files FOR DELETE
TO authenticated
USING (user_id = auth.uid());