import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { fileApi } from '../services/api';
import { FileCard } from '../components/file-manager/FileCard';
import { EmptyState } from '../components/common/EmptyState';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { FileItem } from '../types';

export const TrashPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<FileItem | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);

  const { success, error } = useToast();
  const { refreshUser } = useAuth();

  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fileApi.getAll({ isDeleted: true });
      if (res.data.success) {
        setFiles(res.data.data.files);
      }
    } catch {
      error('Failed to load trash.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (file: FileItem) => {
    try {
      const res = await fileApi.restore(file._id);
      if (res.data.success) {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
        success(`Restored "${file.originalName}".`);
      }
    } catch {
      error('Failed to restore file.');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteItem) return;
    try {
      await fileApi.permanentDelete(deleteItem._id);
      setFiles((prev) => prev.filter((f) => f._id !== deleteItem._id));
      success(`Permanently deleted "${deleteItem.originalName}".`);
      setDeleteItem(null);
      refreshUser();
    } catch {
      error('Failed to delete file permanently.');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      for (const file of files) {
        await fileApi.permanentDelete(file._id);
      }
      setFiles([]);
      setEmptyTrashConfirm(false);
      success('Trash emptied successfully.');
      refreshUser();
    } catch {
      error('Failed to completely empty trash.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-vault-border dark:border-vault-darkBorder">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
              Trash Bin
            </h1>
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              Items in trash can be restored or deleted permanently to free up quota.
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => setEmptyTrashConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          type="trash"
          title="Trash is empty"
          description="Deleted files will be kept here before you choose to permanently purge them."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <FileCard
              key={file._id}
              file={file}
              isTrashView={true}
              onPreview={() => {}}
              onDownload={() => {}}
              onToggleStar={() => {}}
              onShare={() => {}}
              onRename={() => {}}
              onMove={() => {}}
              onDelete={() => {}}
              onRestore={handleRestore}
              onPermanentDelete={(f) => setDeleteItem(f)}
            />
          ))}
        </div>
      )}

      {/* Delete Single File Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteItem}
        title="Permanently delete file?"
        description={`This action cannot be undone. "${deleteItem?.originalName}" will be erased from storage.`}
        confirmLabel="Delete Permanently"
        isPermanent={true}
        onClose={() => setDeleteItem(null)}
        onConfirm={handlePermanentDelete}
      />

      {/* Empty Trash Modal */}
      <DeleteConfirmModal
        isOpen={emptyTrashConfirm}
        title="Empty entire trash?"
        description={`Are you sure you want to permanently delete all ${files.length} items? This action cannot be undone.`}
        confirmLabel="Empty Trash"
        isPermanent={true}
        onClose={() => setEmptyTrashConfirm(false)}
        onConfirm={handleEmptyTrash}
      />
    </div>
  );
};
