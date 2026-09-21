import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Folder, Clock, Star, Plus, Menu } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { CommandPalette } from '../components/common/CommandPalette';
import { UploadDropzoneOverlay } from '../components/common/UploadDropzoneOverlay';
import { UploadQueueWidget } from '../components/common/UploadQueueWidget';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { useUploadStore } from '../store/useUploadStore';
import { useViewStore } from '../store/useViewStore';
import { fileApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const { addToQueue, updateProgress, setStatus } = useUploadStore();
  const {
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    toggleMobileSidebar,
  } = useViewStore();
  const { success, error } = useToast();
  const { refreshUser } = useAuth();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search, setMobileSidebarOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  // Handle Drag & Drop globally on the window
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleUploadFiles(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleUploadFiles = async (files: File[]) => {
    // Determine folder from current search query param if any
    const searchParams = new URLSearchParams(location.search);
    const currentFolderId = searchParams.get('folder');

    const newItems = addToQueue(files, currentFolderId);

    for (const item of newItems) {
      const formData = new FormData();
      formData.append('files', item.file);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      setStatus(item.id, 'uploading');

      try {
        await fileApi.upload(formData, (progress) => {
          updateProgress(item.id, progress);
        });

        setStatus(item.id, 'completed');
        success(`Uploaded ${item.file.name}`);
        refreshUser();
        useViewStore.getState().triggerRefresh();
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Upload failed.';
        setStatus(item.id, 'error', errorMsg);
        error(`Failed to upload ${item.file.name}: ${errorMsg}`);
      }
    }
  };

  const handleManualUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vault-bg dark:bg-vault-darkBg antialiased">
      {/* Hidden file input for manual uploads */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Global Top Navigation */}
      <Navbar
        onOpenUpload={handleManualUploadClick}
        onOpenNewFolder={() => setNewFolderOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Fixed Sidebar */}
        <Sidebar
          className="hidden md:flex flex-shrink-0"
          onOpenUpload={handleManualUploadClick}
          onOpenNewFolder={() => setNewFolderOpen(true)}
        />

        {/* Mobile Slide-out Drawer Backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            aria-hidden="true"
          />
        )}

        {/* Mobile Slide-out Drawer Container */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-vault-surface dark:bg-vault-darkSurface shadow-2xl md:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
        >
          <Sidebar
            className="w-full h-full border-r-0"
            showCloseButton={true}
            onClose={() => setMobileSidebarOpen(false)}
            onItemClick={() => setMobileSidebarOpen(false)}
            onOpenUpload={handleManualUploadClick}
            onOpenNewFolder={() => setNewFolderOpen(true)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-vault-surface/95 dark:bg-vault-darkSurface/95 backdrop-blur-lg border-t border-vault-border dark:border-vault-darkBorder px-2 py-1.5 flex items-center justify-around select-none shadow-lg"
      >
        <NavLink
          to="/files"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-vault-yellowDark dark:text-vault-yellow'
                : 'text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary'
            }`
          }
        >
          <Folder className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span>Files</span>
        </NavLink>

        <NavLink
          to="/recent"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-vault-yellowDark dark:text-vault-yellow'
                : 'text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary'
            }`
          }
        >
          <Clock className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span>Recent</span>
        </NavLink>

        {/* Center Prominent Upload Action */}
        <button
          onClick={handleManualUploadClick}
          aria-label="Upload File"
          className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-vault-yellow text-black font-bold shadow-elevated border-2 border-vault-surface dark:border-vault-darkSurface hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <NavLink
          to="/starred"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-vault-yellowDark dark:text-vault-yellow'
                : 'text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary'
            }`
          }
        >
          <Star className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span>Starred</span>
        </NavLink>

        <button
          onClick={toggleMobileSidebar}
          aria-label="More options"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Utilities */}
      <CommandPalette
        onOpenUpload={handleManualUploadClick}
        onOpenNewFolder={() => setNewFolderOpen(true)}
      />
      <UploadDropzoneOverlay isDragging={isDragging} />
      <UploadQueueWidget />

      <CreateFolderModal
        isOpen={newFolderOpen}
        parentId={new URLSearchParams(location.search).get('folder')}
        onClose={() => setNewFolderOpen(false)}
        onCreated={() => {
          window.dispatchEvent(new CustomEvent('folder-created'));
        }}
      />
    </div>
  );
};
