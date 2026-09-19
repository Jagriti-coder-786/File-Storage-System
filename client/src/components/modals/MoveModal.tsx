import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FolderInput, Folder, Check } from 'lucide-react';
import { modalScale } from '../../animations/variants';
import { fileApi, folderApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FileItem, FolderItem } from '../../types';

interface MoveModalProps {
  item: FileItem | FolderItem | null;
  type: 'file' | 'folder';
  onClose: () => void;
  onMoved: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  item,
  type,
  onClose,
  onMoved,
}) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (item) {
      folderApi.getAll(undefined, true).then((res) => {
        if (res.data.success) {
          // Filter out the folder itself if moving a folder
          const validFolders =
            type === 'folder'
              ? res.data.data.filter((f) => f._id !== item._id)
              : res.data.data;
          setFolders(validFolders);
        }
      });
    }
  }, [item, type]);

  if (!item) return null;

  const handleMove = async () => {
    try {
      setLoading(true);
      if (type === 'file') {
        await fileApi.move(item._id, selectedFolderId);
        success('File moved successfully.');
      } else {
        await folderApi.move(item._id, selectedFolderId);
        success('Folder moved successfully.');
      }
      onMoved();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to move item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        variants={modalScale}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-sm bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-3xl shadow-elevated overflow-hidden z-10 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
              <FolderInput className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Move to Folder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
          Select destination folder for{' '}
          <span className="font-semibold text-vault-textPrimary dark:text-vault-darkText">
            {type === 'file' ? (item as FileItem).originalName : (item as FolderItem).name}
          </span>
        </p>

        {/* Folder Picker list */}
        <div className="max-h-60 overflow-y-auto space-y-1 p-1 bg-vault-bg dark:bg-vault-darkBg rounded-2xl border border-vault-border dark:border-vault-darkBorder">
          {/* Root Option */}
          <div
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
              selectedFolderId === null
                ? 'bg-vault-yellow text-black font-semibold shadow-subtle'
                : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-vault-textPrimary dark:text-vault-darkText'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span>Root (My Files)</span>
            </div>
            {selectedFolderId === null && <Check className="w-4 h-4" />}
          </div>

          {folders.map((f) => (
            <div
              key={f._id}
              onClick={() => setSelectedFolderId(f._id)}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                selectedFolderId === f._id
                  ? 'bg-vault-yellow text-black font-semibold shadow-subtle'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-vault-textPrimary dark:text-vault-darkText'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder className="w-4 h-4 text-amber-500" />
                <span className="truncate">{f.name}</span>
              </div>
              {selectedFolderId === f._id && <Check className="w-4 h-4 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={loading}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
