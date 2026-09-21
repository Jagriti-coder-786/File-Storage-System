import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { AuthRequest } from '../types';
import { File } from '../models/File';
import { User } from '../models/User';
import { Folder } from '../models/Folder';
import { Activity } from '../models/Activity';
import { storageProvider } from '../services/storage';
import { getFileCategory } from '../utils/fileCategory';
import { generateToken, generateSecureToken, verifyToken } from '../utils/token';
import { sanitizeFilename } from '../utils/formatters';
import { renameFileSchema, moveFileSchema, shareFileSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

export const uploadFiles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const files = req.files as Express.Multer.File[];
    const folderId = req.body.folderId && req.body.folderId !== 'null' && req.body.folderId !== 'root'
      ? req.body.folderId
      : null;

    if (!files || files.length === 0) {
      throw new AppError('No files uploaded.', 400, 'NO_FILES');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    // Verify folder exists if provided
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, ownerId: userId, isDeleted: false });
      if (!folder) {
        throw new AppError('Destination folder does not exist.', 404, 'FOLDER_NOT_FOUND');
      }
    }

    // Calculate total batch size and check quota
    const totalBatchSize = files.reduce((acc, f) => acc + f.size, 0);
    if (user.storageUsed + totalBatchSize > user.storageQuota) {
      throw new AppError(
        `Storage quota exceeded. Available: ${(
          (user.storageQuota - user.storageUsed) /
          (1024 * 1024)
        ).toFixed(2)} MB, Required: ${(totalBatchSize / (1024 * 1024)).toFixed(2)} MB.`,
        400,
        'QUOTA_EXCEEDED'
      );
    }

    const createdFiles: any[] = [];
    const uploadedKeys: string[] = [];

    try {
      for (const file of files) {
        let cleanName = file.originalname;
        try {
          cleanName = sanitizeFilename(Buffer.from(file.originalname, 'latin1').toString('utf8'));
        } catch {
          cleanName = sanitizeFilename(file.originalname);
        }
        if (!cleanName || cleanName.trim() === '') {
          cleanName = `file-${Date.now()}`;
        }
        const ext = path.extname(cleanName);
        const storageKey = `${userId}/${uuidv4()}${ext}`;
        const category = getFileCategory(file.mimetype, cleanName);

        // Upload file to active storage provider
        await storageProvider.upload(storageKey, file.buffer, file.mimetype || 'application/octet-stream');
        uploadedKeys.push(storageKey);

        const newFile = await File.create({
          ownerId: userId,
          folderId: folderId ? new mongoose.Types.ObjectId(folderId) : null,
          originalName: cleanName,
          storedName: path.basename(storageKey),
          mimeType: file.mimetype || 'application/octet-stream',
          size: file.size,
          storageKey,
          category,
        });

        createdFiles.push(newFile);

        await Activity.create({
          ownerId: userId,
          action: 'UPLOAD',
          targetType: 'file',
          targetId: newFile._id,
          targetName: newFile.originalName,
          metadata: { size: newFile.size, mimeType: newFile.mimeType },
        });
      }

      // Update user's used storage
      user.storageUsed += totalBatchSize;
      await user.save();

      res.status(201).json({
        success: true,
        message: `${createdFiles.length} file(s) uploaded successfully.`,
        data: createdFiles,
      });
    } catch (batchErr) {
      // Rollback uploaded files in this failed batch
      for (const key of uploadedKeys) {
        await storageProvider.delete(key).catch(() => {});
      }
      for (const f of createdFiles) {
        await File.deleteOne({ _id: f._id }).catch(() => {});
      }
      throw batchErr;
    }
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      folderId,
      isStarred,
      isDeleted,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 100,
    } = req.query;

    const query: any = {
      ownerId: userId,
      isDeleted: isDeleted === 'true',
    };

    // If viewing trash or starred or search, folder filter might not apply
    if (isDeleted === 'true') {
      // Trash view
    } else if (isStarred === 'true') {
      query.isStarred = true;
    } else if (search) {
      query.originalName = { $regex: String(search).trim(), $options: 'i' };
    } else {
      if (folderId === 'root' || !folderId) {
        query.folderId = null;
      } else {
        query.folderId = folderId;
      }
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const [files, totalCount] = await Promise.all([
      File.find(query).sort(sortOptions).skip(skip).limit(limitNum).populate('folderId', 'name color'),
      File.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        files,
        pagination: {
          totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const query: any = { _id: id };
    if (req.user?.role !== 'ADMIN') {
      query.$or = [{ ownerId: userId }, { shareEnabled: true }];
    }

    const file = await File.findOne(query).populate('folderId', 'name');
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    let previewUrl = await storageProvider.getSignedDownloadUrl(
      file.storageKey,
      file.originalName,
      3600,
      true,
      file.mimeType
    );

    // If previewUrl is local /api/files/raw/..., attach a signed token for seamless iframe/img previews
    if (previewUrl && previewUrl.includes('/api/files/raw/')) {
      const authToken = generateToken({
        userId: req.user!.userId,
        email: req.user!.email,
        role: req.user!.role,
      });
      const separator = previewUrl.includes('?') ? '&' : '?';
      previewUrl = `${previewUrl}${separator}token=${encodeURIComponent(authToken)}`;
    }

    res.status(200).json({
      success: true,
      data: {
        file,
        previewUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const query: any = { _id: id };
    if (req.user?.role !== 'ADMIN') {
      query.$or = [{ ownerId: userId }, { shareEnabled: true }];
    }

    const file = await File.findOne(query);
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    file.downloadCount += 1;
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: 'DOWNLOAD',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
    });

    const safeName = file.originalName.replace(/["\r\n\\]/g, '_');
    const encodedName = encodeURIComponent(file.originalName);

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
    );
    res.setHeader('Content-Length', file.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

    const stream = await storageProvider.downloadStream(file.storageKey);
    stream.on('error', (err) => {
      console.error('[downloadFile] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'File download stream error' });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const serveRawFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Explicitly allow cross-origin framing and embedding for previews (PDFs, images, videos)
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

    const rawKey = req.params.key || req.params[0];
    const decodedKey = decodeURIComponent(typeof rawKey === 'string' ? rawKey : '');
    const normalizedKey = decodedKey.replace(/\\/g, '/');
    const baseKey = path.basename(normalizedKey);

    const file = await File.findOne({
      $or: [
        { storageKey: decodedKey },
        { storageKey: rawKey },
        { storageKey: normalizedKey },
        { storedName: baseKey },
        ...(mongoose.isValidObjectId(decodedKey) ? [{ _id: decodedKey }] : []),
        ...(mongoose.isValidObjectId(rawKey) ? [{ _id: rawKey }] : []),
      ],
    });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    // Check authorization:
    let isAuthorized = false;

    let authToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    if (!authToken && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        authToken = parts[1];
      }
    }

    if (authToken) {
      try {
        const payload = verifyToken(authToken);
        if (payload.userId === file.ownerId.toString() || payload.role === 'ADMIN' || payload.userId) {
          isAuthorized = true;
        }
      } catch {
        // invalid token
      }
    }

    if (req.user && (req.user.userId === file.ownerId.toString() || req.user.role === 'ADMIN')) {
      isAuthorized = true;
    }

    const isPublic = file.shareEnabled && (!file.shareExpiresAt || file.shareExpiresAt > new Date());
    if (isPublic) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new AppError('Access forbidden.', 403, 'FORBIDDEN');
    }

    const safeName = file.originalName.replace(/["\r\n\\]/g, '_');
    const encodedName = encodeURIComponent(file.originalName);

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`);
    if (file.size) {
      res.setHeader('Content-Length', file.size);
    }

    const stream = await storageProvider.downloadStream(file.storageKey);
    stream.on('error', (err) => {
      console.error('[serveRawFile] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Stream preview error' });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = renameFileSchema.parse(req.body);
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    const oldName = file.originalName;
    file.originalName = sanitizeFilename(validated.name);
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: 'RENAME',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      metadata: { oldName },
    });

    res.status(200).json({
      success: true,
      message: 'File renamed successfully.',
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const moveFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = moveFileSchema.parse(req.body);
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    let targetFolderId: mongoose.Types.ObjectId | null = null;
    if (validated.targetFolderId) {
      const folder = await Folder.findOne({
        _id: validated.targetFolderId,
        ownerId: userId,
        isDeleted: false,
      });
      if (!folder) {
        throw new AppError('Target folder not found.', 404, 'FOLDER_NOT_FOUND');
      }
      targetFolderId = folder._id;
    }

    file.folderId = targetFolderId;
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: 'MOVE',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      metadata: { targetFolderId },
    });

    res.status(200).json({
      success: true,
      message: 'File moved successfully.',
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    file.isStarred = !file.isStarred;
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: file.isStarred ? 'STAR' : 'UNSTAR',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
    });

    res.status(200).json({
      success: true,
      message: file.isStarred ? 'File added to starred.' : 'File removed from starred.',
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: 'DELETE',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
    });

    res.status(200).json({
      success: true,
      message: 'File moved to trash.',
    });
  } catch (error) {
    next(error);
  }
};

export const restoreFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId, isDeleted: true });
    if (!file) {
      throw new AppError('File not found in trash.', 404, 'FILE_NOT_FOUND');
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: 'RESTORE',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
    });

    res.status(200).json({
      success: true,
      message: 'File restored successfully.',
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    // Delete physically from storage provider
    await storageProvider.delete(file.storageKey);

    // Update user storage quota
    await User.findByIdAndUpdate(userId, {
      $inc: { storageUsed: -file.size },
    });

    // Delete DB record
    await File.deleteOne({ _id: file._id });

    res.status(200).json({
      success: true,
      message: 'File permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

export const shareFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = shareFileSchema.parse(req.body);
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    const shareToken = generateSecureToken(24);
    let shareExpiresAt: Date | null = null;
    if (validated.expiresInDays) {
      shareExpiresAt = new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000);
    }

    file.shareEnabled = true;
    file.shareToken = shareToken;
    file.shareExpiresAt = shareExpiresAt;
    await file.save();

    await Activity.create({
      ownerId: userId,
      action: 'SHARE',
      targetType: 'file',
      targetId: file._id,
      targetName: file.originalName,
      metadata: { shareToken },
    });

    res.status(200).json({
      success: true,
      message: 'Share link generated successfully.',
      data: {
        shareToken: file.shareToken,
        shareExpiresAt: file.shareExpiresAt,
        shareUrl: `/share/${file.shareToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeShare = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, ownerId: userId });
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    file.shareEnabled = false;
    file.shareToken = null;
    file.shareExpiresAt = null;
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Share link revoked successfully.',
    });
  } catch (error) {
    next(error);
  }
};
