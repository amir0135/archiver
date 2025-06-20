import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, Loader2, User, Chrome, Wifi, WifiOff } from 'lucide-react';
import { supabase, testSupabaseConnection } from '../lib/supabase';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'unknown'>('checking');

  useEffect(() => {
    // Test Supabase connection on component mount with better error handling
    const checkConnection = async () => {
      try {
        const isConnected = await testSupabaseConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      } catch (error) {
        console.warn('Connection check failed:', error);
        // Set to unknown instead of disconnected to allow users to still try authentication
        setConnectionStatus('unknown');
      }
    };
    
    checkConnection();
  }, []);

  const getNetworkErrorMessage = (error: any) => {
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return 'Unable to connect to the server. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.';
    }
    return error.message || 'An unexpected error occurred';
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('Google auth error:', err);
      setError(getNetworkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your name');
        }

        console.log('Attempting to sign up with email:', email);
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              role: role
            }
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw signUpError;
        }
        
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
      } else {
        console.log('Attempting to sign in with email:', email);
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          throw signInError;
        }
        
        if (data.session) {
          // Update user metadata if it doesn't exist
          if (!data.user?.user_metadata?.name) {
            await supabase.auth.updateUser({
              data: { name: email.split('@')[0], role: 'user' }
            });
          }
          onAuthSuccess();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(getNetworkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.warn('Retry connection failed:', error);
      setConnectionStatus('unknown');
    }
  };

  // Allow authentication attempts even if connection status is unknown
  const canAttemptAuth = connectionStatus === 'connected' || connectionStatus === 'unknown';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Connection Status */}
          {connectionStatus === 'checking' && (
            <div className="rounded-md bg-yellow-50 p-4 mb-6">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">Checking connection...</p>
                </div>
              </div>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="flex items-center">
                <Wifi className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">Connected to server</p>
                </div>
              </div>
            </div>
          )}

          {connectionStatus === 'disconnected' && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex items-center">
                <WifiOff className="h-5 w-5 text-red-400" />
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">Unable to connect to the server</p>
                  <button
                    onClick={retryConnection}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Retry connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {connectionStatus === 'unknown' && (
            <div className="rounded-md bg-blue-50 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Connection status unknown. You can still try to sign in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleAuth}
              disabled={loading || !canAttemptAuth}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Chrome className="h-5 w-5 text-blue-600 mr-2" />
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Select your role
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="user">Regular User</option>
                    <option value="admin">Administrator</option>
                    <option value="manager">Team Manager</option>
                  </select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Your role determines your access level and permissions
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !canAttemptAuth}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing...
                  </span>
                ) : (
                  isSignUp ? 'Sign up' : 'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}