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
    const cleanKey = key.replace(/\.[^/.]+$/, ''); // Remove extension
    return cleanKey.startsWith('cloudvault/') ? cleanKey : `cloudvault/${cleanKey}`;
  }

  private getResourceType(key: string, mimeType?: string): 'image' | 'video' | 'raw' {
    if (mimeType) {
      // Cloudinary classifies PDFs as 'image' when uploaded with resource_type: 'auto'
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') return 'image';
      if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
      return 'raw';
    }
    const ext = key.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'pdf'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'video';
    return 'raw';
  }

  async upload(key: string, data: Buffer | Readable, mimeType: string): Promise<UploadResult> {
    const rawPublicId = key.replace(/\.[^/.]+$/, '');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: rawPublicId,
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
    const publicId = this.getPublicId(key);
    const primaryType = this.getResourceType(key);
    // Try the primary resource type first, then try alternatives
    const typesToTry: Array<'image' | 'video' | 'raw'> = [primaryType];
    for (const t of ['image', 'video', 'raw'] as const) {
      if (!typesToTry.includes(t)) typesToTry.push(t);
    }

    const fetchUrl = (url: string): Promise<Readable> => {
      return new Promise((resolve, reject) => {
        const fetchWithRedirect = (fetchUrl: string, depth = 0) => {
          if (depth > 5) return reject(new Error('Too many redirects from Cloudinary'));
          const client = fetchUrl.startsWith('https') ? https : http;
          client.get(fetchUrl, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return fetchWithRedirect(res.headers.location, depth + 1);
            }
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(`HTTP ${res.statusCode}`));
            }
            resolve(res);
          }).on('error', (err) => reject(err));
        };
        fetchWithRedirect(url);
      });
    };

    for (const resType of typesToTry) {
      const url = cloudinary.url(publicId, { resource_type: resType, secure: true });
      try {
        return await fetchUrl(url);
      } catch {
        // Try next resource type
      }
    }

    throw new Error(`Failed to fetch file from Cloudinary for key: ${key}`);
  }

  async delete(key: string): Promise<void> {
    const publicId = this.getPublicId(key);
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (err) {
      console.error(`Failed to delete from Cloudinary: ${publicId}`, err);
    }
  }

  async getSignedDownloadUrl(key: string, originalName?: string, _expiresInSeconds: number = 3600, inline: boolean = false, mimeType?: string): Promise<string> {
    const publicId = this.getPublicId(key);
    const resourceType = this.getResourceType(key, mimeType);

    const options: any = {
      resource_type: resourceType,
      secure: true,
    };

    if (!inline) {
      options.flags = 'attachment';
      if (originalName) {
        options.attachment = originalName;
      }
    }

    return cloudinary.url(publicId, options);
  }

  async exists(key: string): Promise<boolean> {
    const publicId = this.getPublicId(key);
    try {
      const res = await cloudinary.api.resource(publicId, { resource_type: 'auto' });
      return !!res;
    } catch {
      return false;
    }
  }
}
