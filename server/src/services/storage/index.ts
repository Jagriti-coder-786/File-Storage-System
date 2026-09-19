import { IStorageProvider } from './IStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
import { env } from '../../config/env';

class StorageFactory {
  private static instance: IStorageProvider;

  public static getProvider(): IStorageProvider {
    if (!this.instance) {
      if (env.STORAGE_PROVIDER === 'cloudinary') {
        console.log('📦 Storage Engine initialized: Cloudinary Object Storage');
        this.instance = new CloudinaryStorageProvider();
      } else if (env.STORAGE_PROVIDER === 's3') {
        console.log('📦 Storage Engine initialized: AWS S3 / Compatible Object Storage');
        this.instance = new S3StorageProvider();
      } else {
        console.log(`📦 Storage Engine initialized: Local Filesystem (${env.LOCAL_STORAGE_DIR}) [Zero-Cost Developer Mode]`);
        this.instance = new LocalStorageProvider();
      }
    }
    return this.instance;
  }
}

export const storageProvider = StorageFactory.getProvider();
export * from './IStorageProvider';
