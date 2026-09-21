import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  FolderPlus,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { FolderCard } from '../components/file-manager/FolderCard';
import { FileCard } from '../components/file-manager/FileCard';
import { FileListItem } from '../components/file-manager/FileListItem';
import { EmptyState } from '../components/common/EmptyState';
import { FilePreviewModal } from '../components/modals/FilePreviewModal';
import { ShareModal } from '../components/modals/ShareModal';
import { RenameModal } from '../components/modals/RenameModal';
import { MoveModal } from '../components/modals/MoveModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { useViewStore } from '../store/useViewStore';
import { fileApi, folderApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileItem, FolderItem, FileCategory } from '../types';

import { apiCache } from '../services/apiCache';

export const MyFilesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder');

  const {
    viewMode,
    setViewMode,
    searchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    refreshVersion,
  } = useViewStore();

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<{ item: any; type: 'file' | 'folder' } | null>(null);
  const [moveItem, setMoveItem] = useState<{ item: any; type: 'file' | 'folder' } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: any; type: 'file' | 'folder' } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const { success, error } = useToast();

  const loadData = useCallback(async (silent = false) => {
    const cacheKey = `files_${folderId || 'root'}_${searchQuery}_${categoryFilter}_${sortBy}_${sortOrder}`;
    const cached = apiCache.get<{ folders: FolderItem[]; files: FileItem[]; breadcrumbs: any[] }>(cacheKey);

    if (cached) {
      setFolders(cached.folders);
      setFiles(cached.files);
      setBreadcrumbs(cached.breadcrumbs);
      setLoading(false);
    } else if (!silent) {
      setLoading(true);
    }

    try {
      const [foldersRes, filesRes] = await Promise.all([
        folderApi.getAll(folderId || 'root'),
        fileApi.getAll({
          folderId: folderId || 'root',
          search: searchQuery || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          sortBy,
          sortOrder,
        }),
      ]);

      let loadedBreadcrumbs: any[] = [];
      if (folderId) {
        const folderDetail = await folderApi.getById(folderId);
        if (folderDetail.data.success) {
          loadedBreadcrumbs = folderDetail.data.data.breadcrumbs;
        }
      }

      if (foldersRes.data.success && filesRes.data.success) {
        const newFolders = foldersRes.data.data;
        const newFiles = filesRes.data.data.files;
        setFolders(newFolders);
        setFiles(newFiles);
        setBreadcrumbs(loadedBreadcrumbs);

        apiCache.set(cacheKey, {
          folders: newFolders,
          files: newFiles,
          breadcrumbs: loadedBreadcrumbs,
        });
      }
    } catch (err: any) {
      if (!cached) {
        error('Failed to load files and folders.');
      }
    } finally {
      setLoading(false);
    }
  }, [folderId, searchQuery, categoryFilter, sortBy, sortOrder, refreshVersion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for global custom events like 'folder-created'
  useEffect(() => {
    const handleRefresh = () => {
      apiCache.invalidate('files');
      apiCache.invalidate('folders');
      loadData(true);
    };
    window.addEventListener('folder-created', handleRefresh);
    return () => window.removeEventListener('folder-created', handleRefresh);
  }, [loadData]);

  const handleNavigateFolder = (targetId: string | null) => {
    if (targetId) {
      setSearchParams({ folder: targetId });
    } else {
      setSearchParams({});
    }
  };

  const handleToggleStar = async (file: FileItem) => {
    try {
      const res = await fileApi.toggleStar(file._id);
      if (res.data.success) {
        setFiles((prev) =>
          prev.map((f) => (f._id === file._id ? { ...f, isStarred: res.data.data.isStarred } : f))
        );
        apiCache.invalidate('files');
        success(res.data.data.isStarred ? 'Added to starred' : 'Removed from starred');
      }
    } catch {
      error('Failed to update star.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    try {
      setActionLoading(true);
      if (deleteItem.type === 'file') {
        await fileApi.delete(deleteItem.item._id);
        setFiles((prev) => prev.filter((f) => f._id !== deleteItem.item._id));
        success('File moved to trash.');
      } else {
        await folderApi.delete(deleteItem.item._id);
        setFolders((prev) => prev.filter((f) => f._id !== deleteItem.item._id));
        success('Folder and contents moved to trash.');
      }
      apiCache.invalidate('files');
      apiCache.invalidate('folders');
      setDeleteItem(null);
    } catch {
      error('Delete failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls: Breadcrumbs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-vault-border dark:border-vault-darkBorder">
        <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigateFolder} />

        {/* View Options & Filters */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-vault-border dark:border-vault-darkBorder bg-vault-surface dark:bg-vault-darkSurface text-xs text-vault-textPrimary dark:text-vault-darkText">
            <Filter className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FileCategory | 'all')}
              className="bg-transparent focus:outline-none cursor-pointer capitalize"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="archive">Archives</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-vault-border dark:border-vault-darkBorder bg-vault-surface dark:bg-vault-darkSurface text-xs text-vault-textPrimary dark:text-vault-darkText">
            <ArrowUpDown className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [any, any];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-vault-border dark:border-vault-darkBorder bg-vault-surface dark:bg-vault-darkSurface">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-vault-yellow text-black shadow-subtle'
                  : 'text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-vault-yellow text-black shadow-subtle'
                  : 'text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
        </div>
      ) : (
        <>
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted">
                Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder._id}
                    folder={folder}
                    onClick={(f) => handleNavigateFolder(f._id)}
                    onRename={(f) => setRenameItem({ item: f, type: 'folder' })}
                    onMove={(f) => setMoveItem({ item: f, type: 'folder' })}
                    onDelete={(f) => setDeleteItem({ item: f, type: 'folder' })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted">
              Files ({files.length})
            </h2>

            {files.length === 0 && folders.length === 0 ? (
              <EmptyState
                type="files"
                title={searchQuery ? 'No matching files found' : 'This folder is empty'}
                description={
                  searchQuery
                    ? `No files or documents match "${searchQuery}".`
                    : 'Drag & drop files anywhere on this page, or click Upload to get started.'
                }
              />
            ) : files.length === 0 ? (
              <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted py-4">
                No files in this folder.
              </p>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {files.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    onPreview={(f) => setPreviewFile(f)}
                    onDownload={(f) => fileApi.download(f._id, f.originalName)}
                    onToggleStar={handleToggleStar}
                    onShare={(f) => setShareFile(f)}
                    onRename={(f) => setRenameItem({ item: f, type: 'file' })}
                    onMove={(f) => setMoveItem({ item: f, type: 'file' })}
                    onDelete={(f) => setDeleteItem({ item: f, type: 'file' })}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <FileListItem
                    key={file._id}
                    file={file}
                    onPreview={(f) => setPreviewFile(f)}
                    onDownload={(f) => fileApi.download(f._id, f.originalName)}
                    onToggleStar={handleToggleStar}
                    onShare={(f) => setShareFile(f)}
                    onRename={(f) => setRenameItem({ item: f, type: 'file' })}
                    onMove={(f) => setMoveItem({ item: f, type: 'file' })}
                    onDelete={(f) => setDeleteItem({ item: f, type: 'file' })}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={(f) => fileApi.download(f._id, f.originalName)}
        onShare={(f) => setShareFile(f)}
        onToggleStar={handleToggleStar}
      />

      <ShareModal
        file={shareFile}
        onClose={() => setShareFile(null)}
        onUpdated={(updated) => {
          setFiles((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
          setShareFile(updated);
        }}
      />

      <RenameModal
        item={renameItem?.item || null}
        type={renameItem?.type || 'file'}
        onClose={() => setRenameItem(null)}
        onRenamed={(updated) => {
          if (renameItem?.type === 'file') {
            setFiles((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
          } else {
            setFolders((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
          }
        }}
      />

      <MoveModal
        item={moveItem?.item || null}
        type={moveItem?.type || 'file'}
        onClose={() => setMoveItem(null)}
        onMoved={loadData}
      />

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        title={`Move ${deleteItem?.type} to trash?`}
        description={`"${
          deleteItem?.type === 'file'
            ? deleteItem?.item.originalName
            : deleteItem?.item.name
        }" will be moved to Trash. You can restore it anytime.`}
        confirmLabel="Move to Trash"
        loading={actionLoading}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
      />

      <CreateFolderModal
        isOpen={createFolderOpen}
        parentId={folderId}
        onClose={() => setCreateFolderOpen(false)}
        onCreated={(newFolder) => setFolders((prev) => [...prev, newFolder])}
      />
    </div>
  );
};
