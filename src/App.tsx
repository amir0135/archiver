import React, { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { supabase, handleAuthCallback } from './lib/supabase';

function App() {
  const [session, setSession] = useState<boolean>(false);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Handle OAuth callback if present
        if (window.location.hash.includes('access_token')) {
          const session = await handleAuthCallback();
          if (session) {
            setSession(true);
            setProviderToken(session.provider_token);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise check current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(!!currentSession);
        setProviderToken(currentSession?.provider_token || null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSession(false);
        setProviderToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setSession(!!session);
      setProviderToken(session?.provider_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {session ? (
        <Dashboard initialProviderToken={providerToken} />
      ) : (
        <Auth onAuthSuccess={() => setSession(true)} />
      )}
    </div>
  );
}

export default App;