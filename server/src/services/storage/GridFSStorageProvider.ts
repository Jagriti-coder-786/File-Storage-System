import { Readable } from 'stream';
import path from 'path';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { IStorageProvider, UploadResult } from './IStorageProvider';

export class GridFSStorageProvider implements IStorageProvider {
  private bucketName: string;

  constructor(bucketName: string = 'vault_files') {
    this.bucketName = bucketName;
  }

  private getBucket(): GridFSBucket {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established for GridFS');
    }
    return new GridFSBucket(mongoose.connection.db, { bucketName: this.bucketName });
  }

  /**
   * Exhaustive resilient file lookup in GridFS:
   * Handles forward slashes, backslashes (Windows vs Linux), URL encoding,
   * basenames, and metadata keys.
   */
  private async findGridFSFile(key: string): Promise<any | null> {
    const bucket = this.getBucket();
    const normalizedKey = key.replace(/\\/g, '/');
    const basename = path.basename(normalizedKey);
    const decodedKey = decodeURIComponent(normalizedKey);
    const decodedBasename = path.basename(decodedKey);

    const candidates = Array.from(
      new Set([
        key,
        normalizedKey,
        decodedKey,
        basename,
        decodedBasename,
        normalizedKey.replace(/\//g, '\\'),
        decodedKey.replace(/\//g, '\\'),
        `/${normalizedKey}`,
      ])
    );

    // 1. Direct match on filename or metadata
    const exactMatches = await bucket
      .find({
        $or: [
          { filename: { $in: candidates } },
          { 'metadata.storageKey': { $in: candidates } },
          { 'metadata.originalName': { $in: candidates } },
        ],
      })
      .limit(1)
      .toArray();

    if (exactMatches && exactMatches.length > 0) {
      return exactMatches[0];
    }

    // 2. Fallback: regex search on the basename (handles uuid prefixes or suffixes)
    const escapedBase = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedDecodedBase = decodedBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regexMatches = await bucket
      .find({
        $or: [
          { filename: { $regex: new RegExp(escapedBase + '$', 'i') } },
          { filename: { $regex: new RegExp(escapedDecodedBase + '$', 'i') } },
        ],
      })
      .limit(1)
      .toArray();

    return regexMatches?.[0] || null;
  }

  async upload(key: string, data: Buffer | Readable, mimeType: string): Promise<UploadResult> {
    const bucket = this.getBucket();

    // Clean up any existing file with the same key to prevent orphaned duplicates
    try {
      const existing = await this.findGridFSFile(key);
      if (existing) {
        await bucket.delete(existing._id);
      }
    } catch {
      // ignore
    }

    const normalizedKey = key.replace(/\\/g, '/');

    if (Buffer.isBuffer(data)) {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(normalizedKey, {
          metadata: { mimeType, size: data.length, storageKey: normalizedKey },
        });

        uploadStream.on('error', (err) => reject(err));
        uploadStream.on('finish', () => {
          resolve({
            storageKey: normalizedKey,
            size: data.length,
            mimeType,
          });
        });

        uploadStream.end(data);
      });
    } else {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(normalizedKey, {
          metadata: { mimeType, storageKey: normalizedKey },
        });

        let size = 0;
        data.on('data', (chunk) => {
          size += chunk.length;
        });

        uploadStream.on('error', (err) => reject(err));
        uploadStream.on('finish', () => {
          resolve({
            storageKey: normalizedKey,
            size,
            mimeType,
          });
        });

        data.pipe(uploadStream);
      });
    }
  }

  async downloadStream(key: string): Promise<Readable> {
    const file = await this.findGridFSFile(key);
    if (!file) {
      throw new Error(`File not found in GridFS storage: ${key}`);
    }
    const bucket = this.getBucket();
    return bucket.openDownloadStream(file._id);
  }

  async delete(key: string): Promise<void> {
    try {
      const bucket = this.getBucket();
      const file = await this.findGridFSFile(key);
      if (file) {
        await bucket.delete(file._id);
      }
    } catch (err) {
      console.warn(`Failed to delete GridFS file ${key}:`, err);
    }
  }

  async getSignedDownloadUrl(
    key: string,
    originalName?: string,
    _expiresInSeconds: number = 3600,
    _inline: boolean = false,
    _mimeType?: string
  ): Promise<string> {
    const encodedName = originalName ? encodeURIComponent(originalName) : 'file';
    const normalizedKey = key.replace(/\\/g, '/');
    const encodedKey = normalizedKey
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');
    return `/api/files/raw/${encodedKey}?name=${encodedName}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!mongoose.connection.db) return false;
      const file = await this.findGridFSFile(key);
      return !!file;
    } catch {
      return false;
    }
  }
}
