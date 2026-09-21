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
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  isMobileSearchOpen: boolean;
  setMobileSearchOpen: (open: boolean) => void;
  toggleMobileSearch: () => void;
  refreshVersion: number;
  triggerRefresh: () => void;
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
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  isMobileSearchOpen: false,
  setMobileSearchOpen: (open) => set({ isMobileSearchOpen: open }),
  toggleMobileSearch: () => set((state) => ({ isMobileSearchOpen: !state.isMobileSearchOpen })),
  refreshVersion: 0,
  triggerRefresh: () => set((state) => ({ refreshVersion: state.refreshVersion + 1 })),
}));
