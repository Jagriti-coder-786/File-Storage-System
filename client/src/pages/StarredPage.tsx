import React, { useState, useEffect, useCallback } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { FileCard } from '../components/file-manager/FileCard';
import { EmptyState } from '../components/common/EmptyState';
import { FilePreviewModal } from '../components/modals/FilePreviewModal';
import { ShareModal } from '../components/modals/ShareModal';
import { RenameModal } from '../components/modals/RenameModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { fileApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileItem } from '../types';
import { apiCache } from '../services/apiCache';

export const StarredPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<{ item: any; type: 'file' } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: any; type: 'file' } | null>(null);

  const { success, error } = useToast();

  const loadStarred = useCallback(async (silent = false) => {
    const cached = apiCache.get<FileItem[]>('starred_files');
    if (cached) {
      setFiles(cached);
      setLoading(false);
    } else if (!silent) {
      setLoading(true);
    }

    try {
      const res = await fileApi.getAll({ isStarred: true });
      if (res.data.success) {
        setFiles(res.data.data.files);
        apiCache.set('starred_files', res.data.data.files);
      }
    } catch {
      if (!cached) {
        error('Failed to load starred files.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStarred();
  }, [loadStarred]);

  const handleToggleStar = async (file: FileItem) => {
    try {
      const res = await fileApi.toggleStar(file._id);
      if (res.data.success) {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
        apiCache.invalidate('starred_files');
        apiCache.invalidate('files');
        success('Removed from starred.');
      }
    } catch {
      error('Failed to unstar.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    try {
      setActionLoading(true);
      await fileApi.delete(deleteItem.item._id);
      setFiles((prev) => prev.filter((f) => f._id !== deleteItem.item._id));
      apiCache.invalidate('starred_files');
      apiCache.invalidate('files');
      success('File moved to trash.');
      setDeleteItem(null);
    } catch {
      error('Delete failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-vault-border dark:border-vault-darkBorder">
        <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
          <Star className="w-5 h-5 fill-vault-yellow" />
        </div>
        <div>
          <h1 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
            Starred Files
          </h1>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            Quickly access your pinned files and important items.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          type="starred"
          title="No starred items"
          description="Star files from your file manager to find them here easily."
        />
      ) : (
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
              onMove={() => {}}
              onDelete={(f) => setDeleteItem({ item: f, type: 'file' })}
            />
          ))}
        </div>
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
        type="file"
        onClose={() => setRenameItem(null)}
        onRenamed={(updated) => {
          setFiles((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
        }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        title="Move file to trash?"
        description={`"${deleteItem?.item.originalName}" will be moved to trash.`}
        confirmLabel="Move to Trash"
        loading={actionLoading}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
