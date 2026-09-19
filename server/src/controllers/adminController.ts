import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { File } from '../models/File';
import { storageProvider } from '../services/storage';
import { AppError } from '../middleware/errorHandler';

export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalFiles,
      storageAggregate,
      categoryStats,
      largestFiles,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      File.countDocuments({ isDeleted: false }),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalBytes: { $sum: '$size' } } },
      ]),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$category', totalSize: { $sum: '$size' }, count: { $sum: 1 } } },
      ]),
      File.find({ isDeleted: false })
        .sort({ size: -1 })
        .limit(5)
        .populate('ownerId', 'name email'),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role storageUsed storageQuota status createdAt'),
    ]);

    const totalStorageUsed = storageAggregate[0]?.totalBytes || 0;

    // Build category chart data
    const categories = {
      documents: 0,
      images: 0,
      videos: 0,
      audio: 0,
      archives: 0,
      other: 0,
    };
    categoryStats.forEach((stat) => {
      const cat = stat._id as keyof typeof categories;
      if (cat in categories) categories[cat] = stat.totalSize;
      else categories.other += stat.totalSize;
    });

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          activeUsers,
          totalFiles,
          totalStorageUsed,
        },
        categories,
        largestFiles,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('name email role avatar storageQuota storageUsed status createdAt'),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
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

export const updateAdminUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, status, storageQuota } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    // Prevent demoting the requesting admin themselves if it's their own account
    if (user._id.toString() === req.user!.userId && role && role !== 'ADMIN') {
      throw new AppError('Cannot revoke your own administrator status.', 400, 'SELF_DEMOTION_FORBIDDEN');
    }

    if (role && ['USER', 'ADMIN'].includes(role)) user.role = role;
    if (status && ['active', 'suspended'].includes(status)) user.status = status;
    if (typeof storageQuota === 'number' && storageQuota > 0) user.storageQuota = storageQuota;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminFiles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, page = 1, limit = 25 } = req.query;

    const query: any = {};
    if (search) {
      query.originalName = { $regex: String(search), $options: 'i' };
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [files, totalCount] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'name email'),
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

export const adminDeleteFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    }

    // Delete physically from storage
    await storageProvider.delete(file.storageKey);

    // Update user quota
    await User.findByIdAndUpdate(file.ownerId, {
      $inc: { storageUsed: -file.size },
    });

    await File.deleteOne({ _id: file._id });

    res.status(200).json({
      success: true,
      message: 'File permanently deleted by administrator.',
    });
  } catch (error) {
    next(error);
  }
};
