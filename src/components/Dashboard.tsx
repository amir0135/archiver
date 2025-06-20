import React, { useState, useEffect, useCallback } from 'react';
import { FileList } from './FileList';
import { SearchBar } from './SearchBar';
import { Sidebar } from './Sidebar';
import { Overview } from './Overview';
import { GoogleDriveConnect } from './GoogleDriveConnect';
import { FigmaConnect } from './FigmaConnect';
import { AIChat } from './AIChat';
import { listFiles } from '../lib/google';
import { listFigmaFiles } from '../lib/figma';
import { UserRole } from '../lib/permissions';
import { supabase } from '../lib/supabase';
import { 
  File,
  AlertCircle,
  Menu,
  X,
  UserCircle,
  Clock,
  FileText,
  Figma
} from 'lucide-react';

interface DashboardProps {
  initialProviderToken: string | null;
}

export function Dashboard({ initialProviderToken }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('overview');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [figmaFiles, setFigmaFiles] = useState<any[]>([]);
  const [figmaConnected, setFigmaConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(() => {
    const saved = localStorage.getItem('showSidebar');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.role) {
          setUserRole(user.user_metadata.role as UserRole);
        }
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        const encodedName = encodeURIComponent(name);
        setAvatarUrl(`https://ui-avatars.com/api/?name=${encodedName}&background=0D8ABC&color=fff&bold=true`);
      }
    };
    getUserData();
  }, []);

  const loadFiles = useCallback(async (token: string) => {
    if (!token || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const files = await listFiles(token);
      setDriveFiles(files);
      setIsConnected(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load files');
      setDriveFiles([]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const loadFigmaFiles = useCallback(async (token: string) => {
    if (!token || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const files = await listFigmaFiles(token);
      setFigmaFiles(files.map(file => ({
        ...file,
        id: file.key,
        mimeType: 'application/figma',
        size: '0',
        modifiedTime: file.lastModified,
        owners: [{ displayName: userName || 'You' }]
      })));
      setFigmaConnected(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load Figma files');
      setFigmaFiles([]);
      setFigmaConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, userName]);

  useEffect(() => {
    let mounted = true;

    if (initialProviderToken && mounted) {
      loadFiles(initialProviderToken);
    }

    return () => { mounted = false; };
  }, [initialProviderToken, loadFiles]);

  const handleDriveConnect = useCallback(async (token: string) => {
    await loadFiles(token);
  }, [loadFiles]);

  const handleDriveDisconnect = useCallback(() => {
    setDriveFiles([]);
    setError(null);
    setIsConnected(false);
  }, []);

  const handleFigmaConnect = useCallback(async (token: string) => {
    await loadFigmaFiles(token);
  }, [loadFigmaFiles]);

  const handleFigmaDisconnect = useCallback(() => {
    setFigmaFiles([]);
    setFigmaConnected(false);
  }, []);

  const handleFileUpdate = useCallback(() => {
    if (initialProviderToken) {
      loadFiles(initialProviderToken);
    }
  }, [initialProviderToken, loadFiles]);

  const handleSync = useCallback(async () => {
    if (initialProviderToken) {
      await loadFiles(initialProviderToken);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.figma_access_token) {
      await loadFigmaFiles(user.user_metadata.figma_access_token);
    }
  }, [initialProviderToken, loadFiles, loadFigmaFiles]);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => {
      const newValue = !prev;
      localStorage.setItem('showSidebar', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const handleViewChange = (view: string) => {
    setSelectedView(view);
    if (view === 'account') {
      // Handle account view change
    }
  };

  // Combine and sort all files
  const allFiles = [...driveFiles, ...figmaFiles]
    .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

  // Get the 4 most recently modified files
  const recentFiles = allFiles.slice(0, 4);

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return File;
    if (mimeType === 'application/figma') return Figma;
    if (mimeType?.includes('image')) return File;
    if (mimeType?.includes('document') || mimeType?.includes('text')) return FileText;
    return File;
  };

  const renderHomepage = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1920px] mx-auto">
        {/* Chat Section - Takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-gray-50/80">
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500 mt-1">Ask questions about your files or get help organizing them</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat />
          </div>
        </div>

        {/* Recent Files Section - Takes 1/3 of the space on large screens */}
        <div className="bg-white rounded-xl shadow-lg p-6 h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recently Modified</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading files...</span>
              </div>
            ) : recentFiles.length > 0 ? (
              <div className="space-y-4">
                {recentFiles.map(file => {
                  const FileIcon = getFileIcon(file.mimeType);
                  return (
                    <div key={file.id} className="flex items-start p-4 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex-shrink-0 mr-4">
                        <FileIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(file.modifiedTime).toLocaleDateString()} • 
                          {file.owners?.[0]?.displayName || 'Unknown'}
                        </p>
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {file.tags.slice(0, 2).map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))}
                            {file.tags.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{file.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button 
                  onClick={() => handleViewChange('my-files')}
                  className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-800 py-3 border border-transparent hover:border-blue-100 rounded-xl transition-colors"
                >
                  View all files →
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <File className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No files yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Connect to Google Drive or Figma to see your files
                </p>
                <div className="mt-6 space-y-4">
                  <GoogleDriveConnect 
                    onConnect={handleDriveConnect}
                    onDisconnect={handleDriveDisconnect}
                  />
                  <FigmaConnect
                    onConnect={handleFigmaConnect}
                    onDisconnect={handleFigmaDisconnect}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
      >
        {showSidebar ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar with transition */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 transform ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <Sidebar 
          selectedView={selectedView}
          onViewChange={handleViewChange}
          userRole={userRole}
          hideAvatar={true}
        />
      </div>
      
      <main className="flex-1 overflow-auto">
        <div className="px-6 lg:px-8 py-6 max-w-[1920px] mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedView === 'overview' ? 'Dashboard Overview' : 'Smart File Organizer'}
                </h1>
                <p className="mt-2 text-gray-600">
                  {selectedView === 'overview' 
                    ? 'View recent activity and insights about your files'
                    : 'Manage and organize your files efficiently'}
                </p>
              </div>

              {/* User Avatar */}
              <button
                onClick={() => handleViewChange('account')}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-10 w-10 rounded-full border-2 border-gray-200 group-hover:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {userName || 'Loading...'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
              </button>
            </div>
          </header>

          {selectedView !== 'overview' && (
            <div className="space-y-4 mb-6">
              <GoogleDriveConnect 
                onConnect={handleDriveConnect}
                onDisconnect={handleDriveDisconnect}
              />
              <FigmaConnect
                onConnect={handleFigmaConnect}
                onDisconnect={handleFigmaDisconnect}
              />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading files</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {selectedView !== 'overview' && (
            <div className="mb-6">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
          )}

          <div className="mt-8">
            {selectedView === 'overview' ? (
              renderHomepage()
            ) : (
              <FileList 
                files={allFiles}
                userRole={userRole}
                onFileUpdate={handleFileUpdate}
                onSync={handleSync}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}