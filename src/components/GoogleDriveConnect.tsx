import React, { useState, useEffect } from 'react';
import { CloudOff, Cloud, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GoogleDriveConnectProps {
  onConnect: (token: string) => void;
  onDisconnect: () => void;
}

export function GoogleDriveConnect({ onConnect, onDisconnect }: GoogleDriveConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock token for testing
  const MOCK_TOKEN = 'mock_token_for_testing';

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session) {
          setIsConnected(true);
          onConnect(MOCK_TOKEN);
        }
      } catch (err) {
        if (mounted) {
          setIsConnected(false);
          setError(err instanceof Error ? err.message : 'Failed to check session');
        }
      }
    };
    
    checkSession();
    return () => { mounted = false; };
  }, [onConnect]);

  const handleConnect = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsConnected(true);
      onConnect(MOCK_TOKEN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Google Drive');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setIsConnected(false);
      onDisconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
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
          {isConnected ? (
            <Cloud className="h-6 w-6 text-green-500" />
          ) : (
            <CloudOff className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Google Drive (Demo Mode)</h3>
            <p className="text-sm text-gray-500">
              {isConnected
                ? 'Connected to demo files'
                : 'Connect to view demo files'}
            </p>
          </div>
        </div>
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isConnected
              ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              : 'text-white bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50 flex items-center space-x-2 transition-colors`}
        >
          {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
          <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>
    </div>
  );
}