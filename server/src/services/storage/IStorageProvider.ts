import { Readable } from 'stream';

export interface UploadResult {
  storageKey: string;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  /**
   * Uploads a file buffer or stream to the storage destination
   */
  upload(key: string, data: Buffer | Readable, mimeType: string): Promise<UploadResult>;

  /**
   * Downloads a file stream from storage
   */
  downloadStream(key: string): Promise<Readable>;

  /**
   * Deletes an object from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Generates a signed or accessible direct URL for downloading/previewing
   */
  getSignedDownloadUrl(key: string, originalName?: string, expiresInSeconds?: number, inline?: boolean): Promise<string>;

  /**
   * Checks if an object exists in storage
   */
  exists(key: string): Promise<boolean>;
}
