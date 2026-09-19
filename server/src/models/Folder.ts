import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  name: string;
  color?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    color: {
      type: String,
      default: '#F5C542',
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
  },
  {
    timestamps: true,
  }
);

FolderSchema.index({ ownerId: 1, parentId: 1, isDeleted: 1 });
FolderSchema.index({ ownerId: 1, name: 1 });

export const Folder = mongoose.model<IFolder>('Folder', FolderSchema);
