import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { modalScale } from '../../animations/variants';
import { folderApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FolderItem } from '../../types';

interface CreateFolderModalProps {
  isOpen: boolean;
  parentId: string | null;
  onClose: () => void;
  onCreated: (folder: FolderItem) => void;
}

const COLOR_OPTIONS = [
  '#F5C542', // Warm Yellow
  '#38BDF8', // Sky Blue
  '#34D399', // Emerald Green
  '#F472B6', // Rose Pink
  '#A78BFA', // Violet
  '#FB923C', // Orange
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  parentId,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#F5C542');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const res = await folderApi.create({
        name: name.trim(),
        parentId,
        color,
      });

      if (res.data.success) {
        success('Folder created successfully.');
        onCreated(res.data.data);
        setName('');
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create folder.');
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
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              New Folder
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
            <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Q3 Financial Reports"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-2">
              Folder Tag Color
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-vault-yellow' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Folder</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
