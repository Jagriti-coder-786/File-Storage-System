import mongoose, { Schema, Document } from 'mongoose';

export type ActivityAction =
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'DELETE'
  | 'RESTORE'
  | 'RENAME'
  | 'STAR'
  | 'UNSTAR'
  | 'SHARE'
  | 'MOVE';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  action: ActivityAction;
  targetType: 'file' | 'folder';
  targetId: mongoose.Types.ObjectId;
  targetName: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['UPLOAD', 'DOWNLOAD', 'DELETE', 'RESTORE', 'RENAME', 'STAR', 'UNSTAR', 'SHARE', 'MOVE'],
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['file', 'folder'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivitySchema.index({ ownerId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
