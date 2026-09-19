import path from 'path';
import { FileCategory } from '../types';

export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const ext = path.extname(filename).toLowerCase().replace('.', '');

  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)
  ) {
    return 'image';
  }

  if (
    mimeType.startsWith('video/') ||
    ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)
  ) {
    return 'video';
  }

  if (
    mimeType.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('text') ||
    ['pdf', 'txt', 'csv', 'json', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'md'].includes(ext)
  ) {
    return 'document';
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('compressed') ||
    mimeType.includes('7z') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archive';
  }

  return 'other';
}
