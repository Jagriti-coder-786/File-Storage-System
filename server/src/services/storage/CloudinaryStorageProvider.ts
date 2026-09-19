import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import http from 'http';
import https from 'https';
import { IStorageProvider, UploadResult } from './IStorageProvider';
import { env } from '../../config/env';

export class CloudinaryStorageProvider implements IStorageProvider {
  constructor() {
    if (env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: env.CLOUDINARY_URL,
      });
    } else {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  private getPublicId(key: string): string {
    return key.replace(/\.[^/.]+$/, ''); // Remove extension for public_id
  }

  async upload(key: string, data: Buffer | Readable, mimeType: string): Promise<UploadResult> {
    const publicId = this.getPublicId(key);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          folder: 'cloudvault',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed'));
          }
          resolve({
            storageKey: result.public_id,
            size: result.bytes,
            mimeType: result.format ? `${result.resource_type}/${result.format}` : mimeType,
          });
        }
      );

      if (Buffer.isBuffer(data)) {
        uploadStream.end(data);
      } else {
        data.pipe(uploadStream);
      }
    });
  }

  async downloadStream(key: string): Promise<Readable> {
    const url = cloudinary.url(key, { resource_type: 'auto', secure: true });

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Failed to fetch file from Cloudinary: HTTP ${res.statusCode}`));
        }
        resolve(res);
      }).on('error', (err) => reject(err));
    });
  }

  async delete(key: string): Promise<void> {
    try {
      // Attempt image/video or raw resource deletion
      await cloudinary.uploader.destroy(key, { resource_type: 'image' });
      await cloudinary.uploader.destroy(key, { resource_type: 'raw' });
      await cloudinary.uploader.destroy(key, { resource_type: 'video' });
    } catch (err) {
      console.error(`Failed to delete from Cloudinary: ${key}`, err);
    }
  }

  async getSignedDownloadUrl(key: string, _originalName?: string, _expiresInSeconds: number = 3600): Promise<string> {
    return cloudinary.url(key, {
      resource_type: 'auto',
      secure: true,
      flags: 'attachment',
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const res = await cloudinary.api.resource(key, { resource_type: 'auto' });
      return !!res;
    } catch {
      return false;
    }
  }
}
