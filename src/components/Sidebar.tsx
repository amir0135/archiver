import React from 'react';
import { 
  LayoutDashboard,
  FolderClosed,
  Users,
  Share2,
  Link2,
  UserCircle,
  Settings,
  LogOut,
  FileIcon
} from 'lucide-react';
import { UserRole, hasPermission } from '../lib/permissions';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  selectedView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
  hideAvatar?: boolean;
}

export function Sidebar({ selectedView, onViewChange, userRole, hideAvatar = false }: SidebarProps) {
  const menuItems = [
    // Main Navigation
    { id: 'overview', icon: LayoutDashboard, label: 'Overview', requiredPermission: null },
    { id: 'my-files', icon: FolderClosed, label: 'My Files', requiredPermission: null },
    { id: 'shared', icon: Share2, label: 'Shared Files', requiredPermission: 'canShareFiles' as const },
    { id: 'team', icon: Users, label: 'Team', requiredPermission: 'canManageUsers' as const },
    
    // System
    { type: 'divider', label: 'System' },
    { id: 'connected-accounts', icon: Link2, label: 'Connected Accounts', requiredPermission: null },
    { id: 'account', icon: UserCircle, label: 'Account', requiredPermission: null },
    { id: 'settings', icon: Settings, label: 'Settings', requiredPermission: 'canAccessSettings' as const },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiredPermission || hasPermission(userRole, item.requiredPermission)
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload(); // Reload to reset the app state
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center space-x-3 mb-8">
        <FileIcon className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">Organizer</span>
      </div>

      <nav className="space-y-1 flex-1">
        {filteredMenuItems.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={`divider-${index}`} className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                selectedView === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}