import React, { useState, useEffect } from 'react';
import { 
  File, 
  FileText, 
  Image, 
  Tag, 
  Folder, 
  Edit2, 
  Plus, 
  RefreshCw,
  Filter,
  Settings
} from 'lucide-react';
import { FilePreferences } from './FilePreferences';
import type { File as FileType } from '../types';
import { UserRole, hasPermission } from '../lib/permissions';
import { updateFileTags, updateFileName } from '../lib/supabase';

type NamingConvention = 'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase';

interface FileListProps {
  files: any[];
  userRole: UserRole;
  onFileUpdate?: () => void;
  onSync?: () => void;
}

type ViewFilter = 'all' | 'files' | 'folders' | 'images' | 'documents' | 'others';

export function FileList({ files, userRole, onFileUpdate, onSync }: FileListProps) {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [editedName, setEditedName] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [namingConvention, setNamingConvention] = useState<NamingConvention>(() => {
    const saved = localStorage.getItem('fileNamingConvention');
    return (saved as NamingConvention) || 'camelCase';
  });

  // Sort files by last modified date
  const sortedFiles = [...files].sort((a, b) => 
    new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
  );

  // Get the 9 most recently modified items
  const recentFiles = sortedFiles.slice(0, 9);

  // Filter files based on selected view
  const filteredFiles = recentFiles.filter(file => {
    switch (viewFilter) {
      case 'folders':
        return file.mimeType === 'application/vnd.google-apps.folder';
      case 'files':
        return file.mimeType !== 'application/vnd.google-apps.folder';
      case 'images':
        return file.mimeType.startsWith('image/');
      case 'documents':
        return file.mimeType.includes('document') || file.mimeType.includes('pdf');
      case 'others':
        return !file.mimeType.startsWith('image/') && 
               !file.mimeType.includes('document') && 
               !file.mimeType.includes('pdf') &&
               file.mimeType !== 'application/vnd.google-apps.folder';
      default:
        return true;
    }
  });

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return Folder;
    if (mimeType?.includes('image')) return Image;
    if (mimeType?.includes('document') || mimeType?.includes('text')) return FileText;
    return File;
  };

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await onSync?.();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddTag = async (fileId: string, currentTags: string[]) => {
    if (!newTag.trim()) return;
    
    try {
      const updatedTags = [...new Set([...(currentTags || []), newTag.trim()])];
      await updateFileTags(fileId, updatedTags);
      setNewTag('');
      setEditingTags(null);
      onFileUpdate?.();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (fileId: string, currentTags: string[], tagToRemove: string) => {
    try {
      const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
      await updateFileTags(fileId, updatedTags);
      onFileUpdate?.();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleRename = async (fileId: string, newName: string) => {
    try {
      await updateFileName(fileId, newName);
      setEditingFile(null);
      onFileUpdate?.();
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  const handleSavePreferences = (preferences: { namingConvention: NamingConvention }) => {
    setNamingConvention(preferences.namingConvention);
    localStorage.setItem('fileNamingConvention', preferences.namingConvention);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Items</option>
              <option value="folders">Folders</option>
              <option value="files">Files</option>
              <option value="images">Images</option>
              <option value="documents">Documents</option>
              <option value="others">Others</option>
            </select>
          </div>

          <button
            onClick={() => setShowPreferences(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Naming Preferences
          </button>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Files'}
        </button>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FilePreferences
            onClose={() => setShowPreferences(false)}
            onSave={handleSavePreferences}
            initialConvention={namingConvention}
          />
        </div>
      )}

      {/* File List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Tags</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2">Last Modified</div>
            <div className="col-span-1">Size</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            const isEditing = editingFile === file.id;
            const isEditingTags = editingTags === file.id;

            return (
              <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      <FileIcon className="h-5 w-5 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onBlur={() => handleRename(file.id, editedName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRename(file.id, editedName);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-medium">{file.name}</span>
                          <button
                            onClick={() => {
                              setEditingFile(file.id);
                              setEditedName(file.name);
                            }}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Edit2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      {file.tags?.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(file.id, file.tags, tag)}
                            className="ml-1 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {isEditingTags ? (
                        <div className="inline-flex items-center">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTag(file.id, file.tags);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddTag(file.id, file.tags)}
                            className="px-2 py-1 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingTags(file.id)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 text-gray-600">
                    {file.owners?.[0]?.displayName || 'Unknown'}
                  </div>
                  <div className="col-span-2 text-gray-600">
                    {new Date(file.modifiedTime).toLocaleDateString()}
                  </div>
                  <div className="col-span-1 text-gray-600">
                    {formatFileSize(parseInt(file.size || '0'))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}