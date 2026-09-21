import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, Loader2 } from 'lucide-react';
import { modalScale } from '../../animations/variants';
import { fileApi, folderApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FileItem, FolderItem } from '../../types';

interface RenameModalProps {
  item: FileItem | FolderItem | null;
  type: 'file' | 'folder';
  onClose: () => void;
  onRenamed: (item: any) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  item,
  type,
  onClose,
  onRenamed,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (item) {
      if (type === 'file') {
        setName((item as FileItem).originalName);
      } else {
        setName((item as FolderItem).name);
      }
    }
  }, [item, type]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      if (type === 'file') {
        const res = await fileApi.rename(item._id, name.trim());
        if (res.data.success) {
          success('File renamed successfully.');
          onRenamed(res.data.data);
          onClose();
        }
      } else {
        const res = await folderApi.rename(item._id, name.trim());
        if (res.data.success) {
          success('Folder renamed successfully.');
          onRenamed(res.data.data);
          onClose();
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Rename failed.');
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
              <Edit2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText capitalize">
              Rename {type}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5 capitalize">
              {type} Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
            />
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
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Rename</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
