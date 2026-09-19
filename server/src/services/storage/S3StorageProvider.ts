import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { IStorageProvider, UploadResult } from './IStorageProvider';
import { env } from '../../config/env';

export class S3StorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET;
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
      endpoint: env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
    });
  }

  async upload(key: string, data: Buffer | Readable, mimeType: string): Promise<UploadResult> {
    let bodyBuffer: Buffer;
    if (Buffer.isBuffer(data)) {
      bodyBuffer = data;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      bodyBuffer = Buffer.concat(chunks);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    return {
      storageKey: key,
      size: bodyBuffer.length,
      mimeType,
    };
  }

  async downloadStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Failed to retrieve S3 object stream for key: ${key}`);
    }

    return response.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async getSignedDownloadUrl(key: string, originalName?: string, expiresInSeconds: number = 3600): Promise<string> {
    const disposition = originalName
      ? `inline; filename="${encodeURIComponent(originalName)}"`
      : 'inline';

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: disposition,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
