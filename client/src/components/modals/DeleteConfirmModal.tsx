import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { modalScale } from '../../animations/variants';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isPermanent?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  isPermanent = false,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen) return null;

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
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl flex-shrink-0 ${
              isPermanent
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
            }`}
          >
            {isPermanent ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              {title}
            </h3>
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-subtle transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer ${
              isPermanent
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isPermanent ? 'Deleting...' : 'Moving...'}</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
