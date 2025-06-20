export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      files: {
        Row: {
          id: string
          user_id: string
          drive_file_id: string
          name: string
          mime_type: string | null
          size: number | null
          modified_time: string | null
          starred: boolean
          tags: string[]
          created_at: string
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          drive_file_id: string
          name: string
          mime_type?: string | null
          size?: number | null
          modified_time?: string | null
          starred?: boolean
          tags?: string[]
          created_at?: string
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          drive_file_id?: string
          name?: string
          mime_type?: string | null
          size?: number | null
          modified_time?: string | null
          starred?: boolean
          tags?: string[]
          created_at?: string
          last_accessed?: string
        }
      }
      file_shares: {
        Row: {
          id: string
          file_id: string
          shared_with: string
          permission: 'viewer' | 'editor'
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          shared_with: string
          permission: 'viewer' | 'editor'
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          shared_with?: string
          permission?: 'viewer' | 'editor'
          created_at?: string
        }
      }
    }
  }
}