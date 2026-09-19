export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  storageQuota: number;
  storageUsed: number;
  createdAt: string;
}

export type FileCategory = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';

export interface FolderItem {
  _id: string;
  ownerId: string;
  parentId: string | null;
  name: string;
  color?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  _id: string;
  ownerId: string;
  folderId: FolderItem | string | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  category: FileCategory;
  isStarred: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  shareEnabled: boolean;
  shareToken?: string;
  shareExpiresAt?: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorageSummary {
  totalQuota: number;
  usedStorage: number;
  availableStorage: number;
  usagePercentage: number;
  totalFiles: number;
  categoryBreakdown: {
    documents: number;
    images: number;
    videos: number;
    audio: number;
    archives: number;
    other: number;
  };
}

export interface ActivityItem {
  _id: string;
  action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'RESTORE' | 'RENAME' | 'STAR' | 'UNSTAR' | 'SHARE' | 'MOVE';
  targetType: 'file' | 'folder';
  targetId: string;
  targetName: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  folderId?: string | null;
}
