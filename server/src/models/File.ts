import mongoose, { Schema, Document } from 'mongoose';
import { FileCategory } from '../types';

export interface IFile extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  category: FileCategory;
  isStarred: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  shareEnabled: boolean;
  shareToken: string | null;
  shareExpiresAt: Date | null;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ['image', 'document', 'video', 'audio', 'archive', 'other'],
      default: 'other',
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    shareEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    shareToken: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    shareExpiresAt: {
      type: Date,
      default: null,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

FileSchema.index({ ownerId: 1, folderId: 1, isDeleted: 1 });
FileSchema.index({ ownerId: 1, isDeleted: 1, createdAt: -1 });
FileSchema.index({ ownerId: 1, isStarred: 1 });

export const File = mongoose.model<IFile>('File', FileSchema);
