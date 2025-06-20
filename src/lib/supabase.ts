import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format. Must start with https://');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    // Add retry configuration for network issues
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Improved connection test function with better error handling and graceful fallback
export async function testSupabaseConnection(): Promise<boolean> {
  // If environment variables are missing, return false immediately
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing');
    return false;
  }

  try {
    // Use a shorter timeout and more graceful error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Try a simple auth check first (this is less likely to fail due to CORS or network issues)
      const { error: authError } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);
      
      // If we can get session info (even if no session exists), connection is working
      if (!authError || authError.message.includes('session_not_found') || authError.message.includes('No session found')) {
        console.log('Supabase connection test successful');
        return true;
      }

      // If auth check fails, try a basic REST API call
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        signal: controller.signal
      });

      if (response.ok) {
        console.log('Supabase REST API connection successful');
        return true;
      }

      console.warn('Supabase connection test failed with status:', response.status);
      return false;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.warn('Supabase connection test timed out - this may indicate network issues');
        return false;
      }
      
      throw fetchError;
    }

  } catch (err: any) {
    // More graceful error handling - don't spam the console
    console.warn('Supabase connection test failed:', err.message || 'Unknown error');
    
    // Provide helpful information only once
    if (err.message?.includes('Failed to fetch')) {
      console.info('This may be due to network connectivity issues. The app will still attempt to function.');
    }
    
    return false;
  }
}

// Handle OAuth callback
export const handleAuthCallback = async () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken) {
    try {
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });

      if (error) throw error;

      if (session) {
        // Clear the URL hash
        window.history.replaceState(null, '', window.location.pathname);
        return session;
      }
    } catch (error) {
      console.error('Error setting session:', error);
      throw error;
    }
  }
  return null;
};

// Optimized file operations with proper error handling
export async function syncFileMetadata(driveFiles: any[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const filesToUpsert = driveFiles.map(file => ({
    user_id: user.id,
    drive_file_id: file.id,
    name: file.name,
    mime_type: file.mimeType,
    size: parseInt(file.size || '0'),
    modified_time: file.modifiedTime,
    last_accessed: new Date().toISOString(),
    tags: file.tags || []
  }));

  const { error } = await supabase
    .from('files')
    .upsert(filesToUpsert, {
      onConflict: 'user_id,drive_file_id'
    });

  if (error) throw error;
}

export async function updateFileTags(fileId: string, tags: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('files')
    .update({ tags })
    .match({ id: fileId, user_id: user.id });

  if (error) throw error;
}

export async function updateFileName(fileId: string, newName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('files')
    .update({ name: newName })
    .match({ id: fileId, user_id: user.id });

  if (error) throw error;
}

export async function shareFile(fileId: string, email: string, permission: 'viewer' | 'editor') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get target user
  const { data: targetUser, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !targetUser) {
    throw new Error('Target user not found');
  }

  // Create share
  const { error: shareError } = await supabase
    .from('file_shares')
    .insert({
      file_id: fileId,
      shared_with: targetUser.id,
      permission
    });

  if (shareError) throw shareError;
}