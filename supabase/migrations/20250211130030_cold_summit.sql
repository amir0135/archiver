/*
  # File Metadata Schema

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `drive_file_id` (text, Google Drive file ID)
      - `name` (text)
      - `mime_type` (text)
      - `size` (bigint)
      - `modified_time` (timestamptz)
      - `starred` (boolean)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `last_accessed` (timestamptz)
      
    - `file_shares`
      - `id` (uuid, primary key)
      - `file_id` (uuid, references files)
      - `shared_with` (uuid, references auth.users)
      - `permission` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for file owners and shared users
*/

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  drive_file_id text NOT NULL,
  name text NOT NULL,
  mime_type text,
  size bigint,
  modified_time timestamptz,
  starred boolean DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  UNIQUE(user_id, drive_file_id)
);

-- Create file_shares table
CREATE TABLE IF NOT EXISTS file_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users NOT NULL,
  permission text NOT NULL CHECK (permission IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(file_id, shared_with)
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- Policies for files table
CREATE POLICY "Users can insert their own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM file_shares
      WHERE file_shares.file_id = files.id
      AND file_shares.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for file_shares table
CREATE POLICY "File owners can manage shares"
  ON file_shares FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_shares.file_id
      AND files.user_id = auth.uid()
    )
  );