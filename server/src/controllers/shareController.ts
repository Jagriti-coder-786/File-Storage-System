import { Request, Response, NextFunction } from 'express';
import { File } from '../models/File';
import { storageProvider } from '../services/storage';
import { AppError } from '../middleware/errorHandler';

export const getSharedFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    const file = await File.findOne({
      shareToken: token,
      shareEnabled: true,
      isDeleted: false,
    }).populate('ownerId', 'name');

    if (!file) {
      throw new AppError('Shared link is invalid or has been revoked.', 404, 'LINK_NOT_FOUND');
    }

    if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
      throw new AppError('This shared link has expired.', 410, 'LINK_EXPIRED');
    }

    const previewUrl = await storageProvider.getSignedDownloadUrl(file.storageKey, file.originalName, 3600, true, file.mimeType);

    res.status(200).json({
      success: true,
      data: {
        id: file._id,
        name: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        category: file.category,
        createdAt: file.createdAt,
        ownerName: (file.ownerId as any)?.name || 'CloudVault User',
        expiresAt: file.shareExpiresAt,
        previewUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadSharedFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    const file = await File.findOne({
      shareToken: token,
      shareEnabled: true,
      isDeleted: false,
    });

    if (!file) {
      throw new AppError('Shared link is invalid or has been revoked.', 404, 'LINK_NOT_FOUND');
    }

    if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
      throw new AppError('This shared link has expired.', 410, 'LINK_EXPIRED');
    }

    file.downloadCount += 1;
    await file.save();

    const stream = await storageProvider.downloadStream(file.storageKey);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
