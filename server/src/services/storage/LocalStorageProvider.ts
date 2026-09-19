import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { IStorageProvider, UploadResult } from './IStorageProvider';
import { env } from '../../config/env';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal outside baseDir
    const sanitizedKey = key.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');
    const targetPath = path.resolve(this.baseDir, sanitizedKey);
    if (!targetPath.startsWith(this.baseDir)) {
      return path.join(this.baseDir, path.basename(sanitizedKey));
    }
    return targetPath;
  }

  async upload(key: string, data: Buffer | Readable, mimeType: string): Promise<UploadResult> {
    const targetPath = this.getFilePath(key);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }

    if (Buffer.isBuffer(data)) {
      await fs.promises.writeFile(targetPath, data);
      return {
        storageKey: key,
        size: data.length,
        mimeType,
      };
    } else {
      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(targetPath);
        let size = 0;

        data.on('data', (chunk) => {
          size += chunk.length;
        });

        data.pipe(writeStream);
        writeStream.on('finish', () => {
          resolve({
            storageKey: key,
            size,
            mimeType,
          });
        });
        writeStream.on('error', (err) => reject(err));
      });
    }
  }

  async downloadStream(key: string): Promise<Readable> {
    const targetPath = this.getFilePath(key);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found in local storage: ${key}`);
    }
    return fs.createReadStream(targetPath);
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.getFilePath(key);
    try {
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
      }
    } catch (err) {
      console.error(`Failed to delete local file ${key}:`, err);
    }
  }

  async getSignedDownloadUrl(key: string, originalName?: string, expiresInSeconds: number = 3600): Promise<string> {
    // In local mode, return an authenticated internal download route
    const encodedName = originalName ? encodeURIComponent(originalName) : 'file';
    return `/api/files/raw/${encodeURIComponent(key)}?name=${encodedName}`;
  }

  async exists(key: string): Promise<boolean> {
    const targetPath = this.getFilePath(key);
    return fs.existsSync(targetPath);
  }
}
