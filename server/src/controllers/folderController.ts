import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { Folder } from '../models/Folder';
import { File } from '../models/File';
import { Activity } from '../models/Activity';
import { createFolderSchema, renameFolderSchema, moveFolderSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';

export const createFolder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createFolderSchema.parse(req.body);
    const userId = req.user!.userId;

    let parentId: mongoose.Types.ObjectId | null = null;
    if (validated.parentId) {
      const parent = await Folder.findOne({
        _id: validated.parentId,
        ownerId: userId,
        isDeleted: false,
      });
      if (!parent) {
        throw new AppError('Parent folder not found.', 404, 'FOLDER_NOT_FOUND');
      }
      parentId = parent._id;
    }

    const folder = await Folder.create({
      ownerId: userId,
      parentId,
      name: validated.name.trim(),
      color: validated.color || '#F5C542',
    });

    await Activity.create({
      ownerId: userId,
      action: 'UPLOAD',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully.',
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const getFolders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { parentId, all } = req.query;

    const query: any = {
      ownerId: userId,
      isDeleted: false,
    };

    if (all !== 'true') {
      if (parentId === 'root' || !parentId) {
        query.parentId = null;
      } else {
        query.parentId = parentId;
      }
    }

    const folders = await Folder.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (error) {
    next(error);
  }
};

export const getFolderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    // Build breadcrumbs path
    const breadcrumbs = [];
    let curr: any = folder;
    breadcrumbs.unshift({ id: curr._id, name: curr.name });

    while (curr.parentId) {
      const parent = await Folder.findOne({ _id: curr.parentId, ownerId: userId });
      if (!parent) break;
      breadcrumbs.unshift({ id: parent._id, name: parent.name });
      curr = parent;
    }

    res.status(200).json({
      success: true,
      data: {
        folder,
        breadcrumbs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const renameFolder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = renameFolderSchema.parse(req.body);
    const userId = req.user!.userId;
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    const oldName = folder.name;
    folder.name = validated.name.trim();
    await folder.save();

    await Activity.create({
      ownerId: userId,
      action: 'RENAME',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name,
      metadata: { oldName },
    });

    res.status(200).json({
      success: true,
      message: 'Folder renamed successfully.',
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const moveFolder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = moveFolderSchema.parse(req.body);
    const userId = req.user!.userId;
    const { id } = req.params;

    if (validated.targetParentId === id) {
      throw new AppError('Cannot move a folder into itself.', 400, 'INVALID_MOVE');
    }

    const folder = await Folder.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    let targetParentId: mongoose.Types.ObjectId | null = null;
    if (validated.targetParentId) {
      const targetParent = await Folder.findOne({
        _id: validated.targetParentId,
        ownerId: userId,
        isDeleted: false,
      });
      if (!targetParent) {
        throw new AppError('Destination folder not found.', 404, 'FOLDER_NOT_FOUND');
      }

      // Check recursion cycle: ensure targetParent is not a descendant of current folder
      let checkCursor: any = targetParent;
      while (checkCursor.parentId) {
        if (checkCursor.parentId.toString() === id) {
          throw new AppError('Cannot move a folder into its own subfolder.', 400, 'CYCLIC_MOVE');
        }
        checkCursor = await Folder.findOne({ _id: checkCursor.parentId, ownerId: userId });
        if (!checkCursor) break;
      }

      targetParentId = targetParent._id;
    }

    folder.parentId = targetParentId;
    await folder.save();

    res.status(200).json({
      success: true,
      message: 'Folder moved successfully.',
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, ownerId: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    // Soft delete folder and subfolders recursively
    const folderIdsToDelete: mongoose.Types.ObjectId[] = [folder._id];
    let queue: mongoose.Types.ObjectId[] = [folder._id];

    while (queue.length > 0) {
      const currentParent = queue.shift();
      const children = await Folder.find({ parentId: currentParent, ownerId: userId, isDeleted: false });
      for (const child of children) {
        folderIdsToDelete.push(child._id);
        queue.push(child._id);
      }
    }

    const now = new Date();
    await Folder.updateMany(
      { _id: { $in: folderIdsToDelete } },
      { isDeleted: true, deletedAt: now }
    );

    // Soft delete all files in these folders
    await File.updateMany(
      { folderId: { $in: folderIdsToDelete }, ownerId: userId, isDeleted: false },
      { isDeleted: true, deletedAt: now }
    );

    await Activity.create({
      ownerId: userId,
      action: 'DELETE',
      targetType: 'folder',
      targetId: folder._id,
      targetName: folder.name,
    });

    res.status(200).json({
      success: true,
      message: 'Folder and its contents moved to trash.',
    });
  } catch (error) {
    next(error);
  }
};
