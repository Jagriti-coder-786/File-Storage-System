import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN';

export interface IUserPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: IUserPayload;
}

export type FileCategory = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';

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

export interface FileFilterQuery {
  folderId?: string;
  isStarred?: boolean;
  isDeleted?: boolean;
  category?: FileCategory;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
