export interface File {
  id: string;
  name: string;
  type: string;
  lastModified: Date;
  owner: string;
  size: number;
  permissions: Permission[];
  source: 'google-drive';
  tags: string[];
  folder?: string;
  metadata?: {
    description?: string;
    project?: string;
    status?: 'active' | 'archived' | 'draft';
    lastAccessed?: Date;
  };
}

export interface Permission {
  userId: string;
  userEmail: string;
  role: 'viewer' | 'editor' | 'owner';
}

export interface FileGroup {
  type: string;
  files: File[];
  totalSize: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}