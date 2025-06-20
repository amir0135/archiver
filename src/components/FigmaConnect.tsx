import React, { useState, useEffect } from 'react';
import { Figma, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FigmaConnectProps {
  onConnect: (token: string) => void;
  onDisconnect: () => void;
}

export function FigmaConnect({ onConnect, onDisconnect }: FigmaConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFigmaConnection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.figma_access_token) {
        setIsConnected(true);
        onConnect(user.user_metadata.figma_access_token);
      }
    };

    checkFigmaConnection();
  }, [onConnect]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    const clientId = import.meta.env.VITE_FIGMA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'files:read';
    
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('figma_auth_state', state);

    const authUrl = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          figma_access_token: null,
        }
      });

      if (updateError) throw updateError;

      setIsConnected(false);
      onDisconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from Figma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-md flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Figma className="h-6 w-6 text-[#1E1E1E]" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Figma</h3>
            <p className="text-sm text-gray-500">
              {isConnected
                ? 'Connected to Figma'
                : 'Connect to access your Figma files'}
            </p>
          </div>
        </div>
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isConnected
              ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              : 'text-white bg-[#1E1E1E] hover:bg-[#2C2C2C]'
          } disabled:opacity-50 flex items-center space-x-2 transition-colors`}
        >
          {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
          <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>
    </div>
  );
}