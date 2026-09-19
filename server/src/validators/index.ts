import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(100),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100),
  parentId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100),
});

export const moveFolderSchema = z.object({
  targetParentId: z.string().nullable(),
});

export const renameFileSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255),
});

export const moveFileSchema = z.object({
  targetFolderId: z.string().nullable(),
});

export const shareFileSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).optional(), // defaults to no expiration or 7 days
});
