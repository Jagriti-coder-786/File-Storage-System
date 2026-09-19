import React, { useRef, useEffect } from 'react';
import {
  Eye,
  Download,
  Star,
  Share2,
  FolderInput,
  Edit2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { FileItem } from '../../types';

interface FileContextMenuProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onToggleStar: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onPermanentDelete?: (file: FileItem) => void;
  isTrashView?: boolean;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  isOpen,
  onClose,
  onPreview,
  onDownload,
  onToggleStar,
  onShare,
  onRename,
  onMove,
  onDelete,
  onRestore,
  onPermanentDelete,
  isTrashView = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-8 z-30 w-48 p-1.5 bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-2xl shadow-elevated text-xs animate-in fade-in zoom-in-95"
    >
      {isTrashView ? (
        <>
          {onRestore && (
            <button
              onClick={() => {
                onClose();
                onRestore(file);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore file</span>
            </button>
          )}
          {onPermanentDelete && (
            <button
              onClick={() => {
                onClose();
                onPermanentDelete(file);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete permanently</span>
            </button>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => {
              onClose();
              onPreview(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onDownload(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <span>Download</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onToggleStar(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                file.isStarred ? 'fill-vault-yellow text-vault-yellow' : 'text-vault-textSecondary dark:text-vault-darkMuted'
              }`}
            />
            <span>{file.isStarred ? 'Unstar' : 'Add to starred'}</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onShare(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <span>Share link</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onMove(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <FolderInput className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <span>Move to folder</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onRename(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <span>Rename</span>
          </button>
          <div className="h-px my-1 bg-vault-border dark:bg-vault-darkBorder" />
          <button
            onClick={() => {
              onClose();
              onDelete(file);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to trash</span>
          </button>
        </>
      )}
    </div>
  );
};
