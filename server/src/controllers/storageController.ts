import { Response, NextFunction } from 'express';
import { AuthRequest, StorageSummary } from '../types';
import { User } from '../models/User';
import { File } from '../models/File';
import { Activity } from '../models/Activity';

export const getStorageSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Aggregate files by category for active non-deleted files
    const categoryStats = await File.aggregate([
      {
        $match: {
          ownerId: user._id,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$category',
          totalSize: { $sum: '$size' },
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown = {
      documents: 0,
      images: 0,
      videos: 0,
      audio: 0,
      archives: 0,
      other: 0,
    };

    let calculatedUsed = 0;
    let totalFiles = 0;

    for (const stat of categoryStats) {
      totalFiles += stat.count;
      calculatedUsed += stat.totalSize;
      const cat = String(stat._id);
      if (cat === 'document') breakdown.documents = stat.totalSize;
      else if (cat === 'image') breakdown.images = stat.totalSize;
      else if (cat === 'video') breakdown.videos = stat.totalSize;
      else if (cat === 'audio') breakdown.audio = stat.totalSize;
      else if (cat === 'archive') breakdown.archives = stat.totalSize;
      else breakdown.other += stat.totalSize;
    }

    const totalQuota = user.storageQuota;
    const usedStorage = calculatedUsed;
    const availableStorage = Math.max(0, totalQuota - usedStorage);
    const usagePercentage = Math.min(100, parseFloat(((usedStorage / totalQuota) * 100).toFixed(2)));

    // Sync actual calculated size with user document if drift exists
    if (user.storageUsed !== usedStorage) {
      user.storageUsed = usedStorage;
      await user.save();
    }

    const summary: StorageSummary = {
      totalQuota,
      usedStorage,
      availableStorage,
      usagePercentage,
      totalFiles,
      categoryBreakdown: breakdown,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(50, parseInt(String(req.query.limit), 10) || 15);

    const activities = await Activity.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
