import axios from 'axios';
import { User, FileItem, FolderItem, StorageSummary, ActivityItem } from '../types';

// Safely normalize base URL for development and production (e.g. Render backend)
let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
if (rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}

export const API_BASE_URL = rawBaseUrl;

export const getFileRawUrl = (storageKey: string, token?: string | null): string => {
  const authToken =
    token !== undefined
      ? token
      : typeof window !== 'undefined'
      ? localStorage.getItem('cloudvault_token')
      : null;
  const query = authToken ? `?token=${encodeURIComponent(authToken)}` : '';
  // Encode each path segment individually so '/' characters are preserved
  // for Express wildcard route matching
  const encodedKey = storageKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${API_BASE_URL}/files/raw/${encodedKey}${query}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudvault_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/share/')) {
      if (localStorage.getItem('cloudvault_token')) {
        localStorage.removeItem('cloudvault_token');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ success: boolean; data: { token: string; user: User }; message: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; data: { token: string; user: User }; message: string }>('/auth/login', data),
  getMe: () => api.get<{ success: boolean; data: User }>('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.patch<{ success: boolean; data: User; message: string }>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/change-password', data),
};

// Folders Services
export const folderApi = {
  create: (data: { name: string; parentId?: string | null; color?: string }) =>
    api.post<{ success: boolean; data: FolderItem; message: string }>('/folders', data),
  getAll: (parentId?: string | null, all?: boolean) =>
    api.get<{ success: boolean; data: FolderItem[] }>('/folders', {
      params: { parentId: parentId || undefined, all: all ? 'true' : undefined },
    }),
  getById: (id: string) =>
    api.get<{ success: boolean; data: { folder: FolderItem; breadcrumbs: Array<{ id: string; name: string }> } }>(
      `/folders/${id}`
    ),
  rename: (id: string, name: string) =>
    api.patch<{ success: boolean; data: FolderItem; message: string }>(`/folders/${id}/rename`, { name }),
  move: (id: string, targetParentId: string | null) =>
    api.patch<{ success: boolean; data: FolderItem; message: string }>(`/folders/${id}/move`, { targetParentId }),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/folders/${id}`),
};

// Files Services
export const fileApi = {
  upload: (formData: FormData, onProgress?: (progress: number) => void) =>
    api.post<{ success: boolean; data: FileItem[]; message: string }>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
  getAll: (params?: {
    folderId?: string | null;
    isStarred?: boolean;
    isDeleted?: boolean;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) =>
    api.get<{
      success: boolean;
      data: {
        files: FileItem[];
        pagination: { totalCount: number; page: number; limit: number; totalPages: number };
      };
    }>('/files', { params }),
  getById: (id: string) =>
    api.get<{ success: boolean; data: { file: FileItem; previewUrl: string } }>(`/files/${id}`),
  download: async (id: string, originalName?: string) => {
    try {
      const response = await api.get(`/files/${id}/download`, {
        responseType: 'blob',
      });
      
      let filename = originalName || 'downloaded-file';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      throw error;
    }
  },
  rename: (id: string, name: string) =>
    api.patch<{ success: boolean; data: FileItem; message: string }>(`/files/${id}/rename`, { name }),
  move: (id: string, targetFolderId: string | null) =>
    api.patch<{ success: boolean; data: FileItem; message: string }>(`/files/${id}/move`, { targetFolderId }),
  toggleStar: (id: string) =>
    api.post<{ success: boolean; data: FileItem; message: string }>(`/files/${id}/star`),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/files/${id}`),
  restore: (id: string) =>
    api.post<{ success: boolean; data: FileItem; message: string }>(`/files/${id}/restore`),
  permanentDelete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/files/${id}/permanent`),
  share: (id: string, expiresInDays?: number) =>
    api.post<{
      success: boolean;
      data: { shareToken: string; shareExpiresAt: string | null; shareUrl: string };
      message: string;
    }>(`/files/${id}/share`, { expiresInDays }),
  revokeShare: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/files/${id}/share`),
};

// Public Sharing Services
export const publicShareApi = {
  get: (token: string) =>
    api.get<{
      success: boolean;
      data: {
        id: string;
        name: string;
        size: number;
        mimeType: string;
        category: string;
        createdAt: string;
        ownerName: string;
        expiresAt: string | null;
        previewUrl: string;
      };
    }>(`/public/share/${token}`),
  getDownloadUrl: (token: string) => `${API_BASE_URL}/public/share/${token}/download`,
};

// Storage Services
export const storageApi = {
  getSummary: () => api.get<{ success: boolean; data: StorageSummary }>('/storage/summary'),
  getActivities: (limit?: number) =>
    api.get<{ success: boolean; data: ActivityItem[] }>('/storage/activities', { params: { limit } }),
};

// Admin Services
export const adminApi = {
  getStats: () => api.get<{ success: boolean; data: any }>('/admin/stats'),
  getUsers: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { users: User[]; pagination: any } }>('/admin/users', { params }),
  updateUser: (id: string, data: { role?: string; status?: string; storageQuota?: number }) =>
    api.patch<{ success: boolean; data: User; message: string }>(`/admin/users/${id}`, data),
  getFiles: (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { files: any[]; pagination: any } }>('/admin/files', { params }),
  deleteFile: (id: string) => api.delete<{ success: boolean; message: string }>(`/admin/files/${id}`),
};
