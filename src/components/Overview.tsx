import React, { useState } from 'react';
import { 
  Clock,
  Copy,
  Shield,
  FolderTree,
  AlertTriangle,
  FileWarning,
  FileCheck,
  Info,
  ChevronRight,
  Folder,
  FolderOpen,
  File as FileIcon,
  Lightbulb,
  Users,
  UserCircle
} from 'lucide-react';

interface OverviewProps {
  files: any[];
}

interface FolderStructure {
  [key: string]: {
    [key: string]: string[];
  };
}

export function Overview({ files }: OverviewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const recentFiles = files
    .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
    .slice(0, 8);

  // Find potential duplicate names
  const fileNames = files.map(f => f.name.toLowerCase());
  const duplicateNames = fileNames.filter((name, index) => fileNames.indexOf(name) !== index);
  
  // Find potentially sensitive files
  const sensitivePatterns = ['password', 'secret', 'private', 'confidential', 'personal'];
  const sensitiveFiles = files.filter(file => 
    sensitivePatterns.some(pattern => file.name.toLowerCase().includes(pattern))
  );

  // Analyze file access patterns
  const fileAccessMap = files.reduce((acc, file) => {
    const owner = file.owners?.[0]?.displayName || 'Unknown';
    if (!acc[owner]) {
      acc[owner] = {
        owned: [],
        shared: []
      };
    }
    acc[owner].owned.push(file);
    return acc;
  }, {});

  // Generate folder structure
  const folderStructure: FolderStructure = files.reduce((acc, file) => {
    const [category, subtype] = file.mimeType.split('/');
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][subtype]) {
      acc[category][subtype] = [];
    }
    acc[category][subtype].push(file.name);
    return acc;
  }, {});

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFolderStructure = () => {
    return Object.entries(folderStructure).map(([category, subtypes]) => {
      const categoryPath = category;
      const isCategoryExpanded = expandedFolders.has(categoryPath);

      return (
        <div key={category} className="space-y-2">
          <button
            onClick={() => toggleFolder(categoryPath)}
            className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded-lg group"
          >
            <ChevronRight 
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isCategoryExpanded ? 'transform rotate-90' : ''
              }`}
            />
            <Folder className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-700 group-hover:text-gray-900">
              {category.charAt(0).toUpperCase() + category.slice(1)}s
            </span>
            <span className="text-sm text-gray-400">
              ({Object.keys(subtypes).length} types)
            </span>
          </button>

          {isCategoryExpanded && (
            <div className="ml-6 space-y-2 border-l-2 border-gray-100 pl-4">
              {Object.entries(subtypes).map(([subtype, files]) => {
                const subtypePath = `${categoryPath}/${subtype}`;
                const isSubtypeExpanded = expandedFolders.has(subtypePath);

                return (
                  <div key={subtype} className="space-y-2">
                    <button
                      onClick={() => toggleFolder(subtypePath)}
                      className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded-lg group"
                    >
                      <ChevronRight 
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          isSubtypeExpanded ? 'transform rotate-90' : ''
                        }`}
                      />
                      {isSubtypeExpanded ? (
                        <FolderOpen className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Folder className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium text-gray-600 group-hover:text-gray-900">
                        {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({files.length} files)
                      </span>
                    </button>

                    {isSubtypeExpanded && (
                      <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                        {files.map((fileName, index) => (
                          <div 
                            key={index}
                            className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                          >
                            <FileIcon className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{fileName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Recent Files Section */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Recently Modified Files</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentFiles.map(file => (
            <div 
              key={file.id}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(file.modifiedTime).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* File Insights Section */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900">File Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Access Insights */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Access Overview</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(fileAccessMap).map(([owner, files], index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <UserCircle className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium text-gray-700">{owner}</span>
                    <span className="text-sm text-gray-500">
                      ({files.owned.length} files)
                    </span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {files.owned.slice(0, 3).map((file: any, fileIndex: number) => (
                      <div key={fileIndex} className="text-sm text-gray-600 flex items-center space-x-2">
                        <FileIcon className="h-3 w-3 text-gray-400" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                    {files.owned.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{files.owned.length - 3} more files
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicate Files */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Copy className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Potential Duplicates</h3>
            </div>
            {duplicateNames.length > 0 ? (
              <ul className="space-y-2">
                {duplicateNames.map((name, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <FileWarning className="h-4 w-4 text-orange-500 mt-1" />
                    <span className="text-gray-700">{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center space-x-2 text-green-700">
                <FileCheck className="h-4 w-4" />
                <span>No duplicate file names found</span>
              </div>
            )}
          </div>

          {/* Security Insights */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Security Insights</h3>
            </div>
            {sensitiveFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                  <p className="text-gray-700">
                    Found {sensitiveFiles.length} potentially sensitive {sensitiveFiles.length === 1 ? 'file' : 'files'}
                  </p>
                </div>
                <ul className="space-y-2">
                  {sensitiveFiles.map(file => (
                    <li key={file.id} className="text-sm text-gray-600 flex items-center space-x-2">
                      <Info className="h-3 w-3" />
                      <span>{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-700">
                <Shield className="h-4 w-4" />
                <span>No sensitive files detected</span>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <FolderTree className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Suggested File Structure</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                Based on your file types, here's a suggested organization structure:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                {renderFolderStructure()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}