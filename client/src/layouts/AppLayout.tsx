import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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

  const { addToQueue, updateProgress, setStatus, queue } = useUploadStore();
  const { success, error } = useToast();
  const { refreshUser } = useAuth();

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
    <div className="min-h-screen flex flex-col bg-vault-bg dark:bg-vault-darkBg">
      {/* Hidden file input for manual uploads */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <Navbar
        onOpenUpload={handleManualUploadClick}
        onOpenNewFolder={() => setNewFolderOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="hidden md:flex flex-shrink-0" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

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
          // Trigger a reload event or router update
          window.dispatchEvent(new CustomEvent('folder-created'));
        }}
      />
    </div>
  );
};
