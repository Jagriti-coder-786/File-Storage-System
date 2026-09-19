import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Folder } from '../models/Folder';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../validators';
import { generateToken } from '../utils/token';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await User.create({
      name: validated.name,
      email: validated.email,
      passwordHash,
      role: 'USER',
    });

    // Create default starter folders for the user
    await Folder.create([
      { ownerId: user._id, name: 'Documents', color: '#F5C542' },
      { ownerId: user._id, name: 'Images', color: '#38BDF8' },
      { ownerId: user._id, name: 'Projects', color: '#34D399' },
    ]);

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          storageQuota: user.storageQuota,
          storageUsed: user.storageUsed,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'suspended') {
      throw new AppError('Account is suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    const isMatch = await user.comparePassword(validated.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          storageQuota: user.storageQuota,
          storageUsed: user.storageUsed,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        storageQuota: user.storageQuota,
        storageUsed: user.storageUsed,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = updateProfileSchema.parse(req.body);

    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (validated.name) user.name = validated.name;
    if (validated.avatar !== undefined) user.avatar = validated.avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        storageQuota: user.storageQuota,
        storageUsed: user.storageUsed,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = changePasswordSchema.parse(req.body);

    const user = await User.findById(req.user!.userId).select('+passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(validated.currentPassword);
    if (!isMatch) {
      throw new AppError('Current password does not match.', 400, 'PASSWORD_MISMATCH');
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(validated.newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
