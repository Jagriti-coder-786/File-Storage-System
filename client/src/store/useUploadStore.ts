import { create } from 'zustand';
import { UploadQueueItem } from '../types';

interface UploadStore {
  queue: UploadQueueItem[];
  isUploading: boolean;
  isOpen: boolean;
  addToQueue: (files: File[], folderId?: string | null) => UploadQueueItem[];
  updateProgress: (id: string, progress: number) => void;
  setStatus: (id: string, status: UploadQueueItem['status'], error?: string) => void;
  removeFromQueue: (id: string) => void;
  clearCompleted: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  queue: [],
  isUploading: false,
  isOpen: false,
  addToQueue: (files, folderId) => {
    const newItems: UploadQueueItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending',
      folderId,
    }));
    set((state) => ({
      queue: [...state.queue, ...newItems],
      isOpen: true,
    }));
    return newItems;
  },
  updateProgress: (id, progress) =>
    set((state) => ({
      queue: state.queue.map((item) => (item.id === id ? { ...item, progress } : item)),
    })),
  setStatus: (id, status, error) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status, error: error || item.error } : item
      ),
      isUploading: state.queue.some((item) => item.status === 'uploading'),
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    })),
  clearCompleted: () =>
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'completed'),
    })),
  setIsOpen: (isOpen) => set({ isOpen }),
}));
