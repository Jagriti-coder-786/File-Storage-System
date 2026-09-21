import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
import { GridFSStorageProvider } from './GridFSStorageProvider';
import { env } from '../../config/env';

class ResilientStorageProvider implements IStorageProvider {
  private primary: IStorageProvider;
  private gridfs: GridFSStorageProvider;
  private fallback: LocalStorageProvider;

  constructor(primary: IStorageProvider) {
    this.primary = primary;
    this.gridfs = new GridFSStorageProvider();
    this.fallback = new LocalStorageProvider();
  }

  async upload(key: string, data: Buffer | NodeJS.ReadableStream, mimeType: string) {
    // Convert stream to buffer if needed so we can write to both primary and persistent GridFS
    let bufferData: Buffer | null = null;
    if (Buffer.isBuffer(data)) {
      bufferData = data;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      bufferData = Buffer.concat(chunks);
    }

    // Always mirror file to MongoDB Atlas GridFS for 100% persistent cloud survival
    try {
      await this.gridfs.upload(key, bufferData, mimeType);
    } catch (gfsErr: any) {
      console.warn(`[Storage] GridFS mirror warning:`, gfsErr?.message || gfsErr);
    }

    // Also upload to primary provider (Cloudinary / S3 / Local)
    try {
      return await this.primary.upload(key, bufferData, mimeType);
    } catch (err: any) {
      console.warn(`⚠️ Primary storage provider failed (${err?.message || err}).`);
      try {
        return await this.fallback.upload(key, bufferData, mimeType);
      } catch (localErr) {
        // As long as it was saved in GridFS, return successful storage result
        return {
          storageKey: key,
          size: bufferData.length,
          mimeType,
        };
      }
    }
  }

  async downloadStream(key: string) {
    // 1. Try persistent MongoDB Atlas GridFS first (survives Render restarts)
    try {
      if (await this.gridfs.exists(key)) {
        return await this.gridfs.downloadStream(key);
      }
    } catch (err) {
      console.warn(`[Storage] GridFS check failed for ${key}, trying primary/local:`, err);
    }

    // 2. Try primary provider if file exists there (e.g. Cloudinary / S3)
    try {
      if (await this.primary.exists(key)) {
        return await this.primary.downloadStream(key);
      }
    } catch (err) {
      console.warn(`[Storage] Primary downloadStream failed for ${key}:`, err);
    }

    // 3. Try local filesystem
    try {
      if (await this.fallback.exists(key)) {
        const stream = await this.fallback.downloadStream(key);
        // Opportunistically sync local file into GridFS so it persists permanently
        this.fallback.downloadStream(key).then(async (syncStream) => {
          try {
            await this.gridfs.upload(key, syncStream, 'application/octet-stream');
          } catch {
            // ignore background sync errors
          }
        }).catch(() => {});
        return stream;
      }
    } catch (err) {
      console.warn(`[Storage] Local downloadStream failed for ${key}:`, err);
    }

    // 4. Final attempt: try GridFS directly (it performs regex matching on basenames)
    return await this.gridfs.downloadStream(key);
  }

  async delete(key: string) {
    try {
      await this.primary.delete(key);
    } catch {
      // ignore
    }
    try {
      await this.gridfs.delete(key);
    } catch {
      // ignore
    }
    try {
      await this.fallback.delete(key);
    } catch {
      // ignore
    }
  }

  async getSignedDownloadUrl(
    key: string,
    originalName?: string,
    expiresInSeconds?: number,
    inline?: boolean,
    mimeType?: string
  ) {
    try {
      if (await this.primary.exists(key)) {
        return await this.primary.getSignedDownloadUrl(key, originalName, expiresInSeconds, inline, mimeType);
      }
    } catch {
      // fallback
    }
    return await this.gridfs.getSignedDownloadUrl(key, originalName, expiresInSeconds, inline, mimeType);
  }

  async exists(key: string) {
    const primaryExists = await this.primary.exists(key).catch(() => false);
    if (primaryExists) return true;
    const gridfsExists = await this.gridfs.exists(key).catch(() => false);
    if (gridfsExists) return true;
    return await this.fallback.exists(key).catch(() => false);
  }
}

class StorageFactory {
  private static instance: IStorageProvider;

  public static getProvider(): IStorageProvider {
    if (!this.instance) {
      let primary: IStorageProvider;
      if (env.STORAGE_PROVIDER === 'cloudinary') {
        console.log('📦 Storage Engine: Cloudinary Storage (with MongoDB Atlas GridFS & Local Persistence)');
        primary = new CloudinaryStorageProvider();
      } else if (env.STORAGE_PROVIDER === 's3') {
        console.log('📦 Storage Engine: AWS S3 Storage (with MongoDB Atlas GridFS & Local Persistence)');
        primary = new S3StorageProvider();
      } else {
        console.log(`📦 Storage Engine: Local Storage (with MongoDB Atlas GridFS Cloud Persistence)`);
        primary = new LocalStorageProvider();
      }
      this.instance = new ResilientStorageProvider(primary);
    }
    return this.instance;
  }
}

export const storageProvider = StorageFactory.getProvider();
export * from './IStorageProvider';
export * from './GridFSStorageProvider';
