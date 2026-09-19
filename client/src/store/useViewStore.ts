import { create } from 'zustand';
import { FileCategory } from '../types';

interface ViewStore {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: FileCategory | 'all';
  setCategoryFilter: (category: FileCategory | 'all') => void;
  sortBy: 'name' | 'createdAt' | 'size';
  setSortBy: (sortBy: 'name' | 'createdAt' | 'size') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

const savedViewMode = (localStorage.getItem('cloudvault_view_mode') as 'grid' | 'list') || 'grid';

export const useViewStore = create<ViewStore>((set) => ({
  viewMode: savedViewMode,
  setViewMode: (mode) => {
    localStorage.setItem('cloudvault_view_mode', mode);
    set({ viewMode: mode });
  },
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  categoryFilter: 'all',
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  sortBy: 'createdAt',
  setSortBy: (sortBy) => set({ sortBy }),
  sortOrder: 'desc',
  setSortOrder: (sortOrder) => set({ sortOrder }),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
}));
