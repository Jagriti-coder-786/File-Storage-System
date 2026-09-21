import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
import { env } from '../../config/env';

class ResilientStorageProvider implements IStorageProvider {
  private primary: IStorageProvider;
  private fallback: LocalStorageProvider;

  constructor(primary: IStorageProvider) {
    this.primary = primary;
    this.fallback = new LocalStorageProvider();
  }

  async upload(key: string, data: Buffer | NodeJS.ReadableStream, mimeType: string) {
    try {
      return await this.primary.upload(key, data as any, mimeType);
    } catch (err: any) {
      if (this.primary !== this.fallback) {
        console.warn(`⚠️ Primary storage provider failed (${err?.message || err}). Falling back to local storage.`);
        return await this.fallback.upload(key, data as any, mimeType);
      }
      throw err;
    }
  }

  async downloadStream(key: string) {
    try {
      if (await this.primary.exists(key)) {
        return await this.primary.downloadStream(key);
      }
    } catch (err) {
      // primary failed, try fallback
    }
    return await this.fallback.downloadStream(key);
  }

  async delete(key: string) {
    try {
      await this.primary.delete(key);
    } catch (err) {
      // ignore
    }
    await this.fallback.delete(key);
  }

  async getSignedDownloadUrl(key: string, originalName?: string, expiresInSeconds?: number, inline?: boolean, mimeType?: string) {
    try {
      if (await this.primary.exists(key)) {
        return await this.primary.getSignedDownloadUrl(key, originalName, expiresInSeconds, inline, mimeType);
      }
    } catch (err) {
      // fallback
    }
    return await this.fallback.getSignedDownloadUrl(key, originalName, expiresInSeconds, inline, mimeType);
  }

  async exists(key: string) {
    const primaryExists = await this.primary.exists(key).catch(() => false);
    if (primaryExists) return true;
    return await this.fallback.exists(key).catch(() => false);
  }
}

class StorageFactory {
  private static instance: IStorageProvider;

  public static getProvider(): IStorageProvider {
    if (!this.instance) {
      let primary: IStorageProvider;
      if (env.STORAGE_PROVIDER === 'cloudinary') {
        console.log('📦 Storage Engine initialized: Cloudinary Object Storage (with Local Fallback)');
        primary = new CloudinaryStorageProvider();
      } else if (env.STORAGE_PROVIDER === 's3') {
        console.log('📦 Storage Engine initialized: AWS S3 Object Storage (with Local Fallback)');
        primary = new S3StorageProvider();
      } else {
        console.log(`📦 Storage Engine initialized: Local Filesystem (${env.LOCAL_STORAGE_DIR}) [High Performance Production Mode]`);
        primary = new LocalStorageProvider();
      }
      this.instance = new ResilientStorageProvider(primary);
    }
    return this.instance;
  }
}

export const storageProvider = StorageFactory.getProvider();
export * from './IStorageProvider';
