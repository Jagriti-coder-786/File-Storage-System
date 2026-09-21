import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  Download,
  Star,
  Share2,
  FolderInput,
  Edit2,
  Trash2,
  RotateCcw,
  X,
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
  anchorRef?: React.RefObject<HTMLButtonElement | HTMLDivElement | null>;
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
  anchorRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Calculate position for desktop portal menu based on anchor element
  useEffect(() => {
    if (!isOpen || isMobile) {
      setMenuPos(null);
      return;
    }
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = 340; // approximate max height
      let top = rect.bottom + 4;
      let left = rect.right - menuWidth;

      // If menu would overflow bottom, open upward
      if (top + menuHeight > window.innerHeight - 16) {
        top = rect.top - menuHeight - 4;
        if (top < 8) top = 8;
      }
      // Keep within left edge
      if (left < 8) left = 8;

      setMenuPos({ top, left });
    }
  }, [isOpen, isMobile, anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      // Small delay to prevent immediate close from the same click that opened the menu
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  const menuItems = isTrashView ? (
    <>
      {onRestore && (
        <button
          onClick={() => {
            onClose();
            onRestore(file);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
        >
          <RotateCcw className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
          <span>Restore file</span>
        </button>
      )}
      {onPermanentDelete && (
        <button
          onClick={() => {
            onClose();
            onPermanentDelete(file);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
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
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
      >
        <Eye className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
        <span>Preview</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onDownload(file);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
      >
        <Download className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
        <span>Download</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onToggleStar(file);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
      >
        <Star
          className={`w-5 h-5 sm:w-3.5 sm:h-3.5 ${
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
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
      >
        <Share2 className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
        <span>Share link</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onMove(file);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
      >
        <FolderInput className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
        <span>Move to folder</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onRename(file);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
      >
        <Edit2 className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
        <span>Rename</span>
      </button>
      <div className="h-px my-1 bg-vault-border dark:bg-vault-darkBorder" />
      <button
        onClick={() => {
          onClose();
          onDelete(file);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 sm:px-2.5 sm:py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
      >
        <Trash2 className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
        <span>Move to trash</span>
      </button>
    </>
  );

  // ── MOBILE: Bottom sheet via portal ──
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
        />
        {/* Sheet */}
        <div
          ref={menuRef}
          className="relative w-full bg-vault-surface dark:bg-vault-darkSurface border-t border-vault-border dark:border-vault-darkBorder rounded-t-3xl shadow-elevated p-2 pb-6 animate-in slide-in-from-bottom duration-200 z-10 max-h-[80vh] overflow-y-auto text-sm"
        >
          {/* Handle bar */}
          <div className="flex justify-center py-2 mb-1">
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </div>
          {/* File name header */}
          <div className="px-4 pb-2 mb-1 border-b border-vault-border dark:border-vault-darkBorder">
            <p className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText truncate">
              {file.originalName}
            </p>
          </div>
          {menuItems}
        </div>
      </div>,
      document.body
    );
  }

  // ── DESKTOP: Portal-based dropdown at anchor position ──
  if (menuPos) {
    return createPortal(
      <div
        ref={menuRef}
        style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
        className="w-48 p-1.5 bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-2xl shadow-elevated text-xs animate-in fade-in zoom-in-95"
      >
        {menuItems}
      </div>,
      document.body
    );
  }

  // Fallback: render inline (shouldn't normally reach here)
  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-8 z-30 w-48 p-1.5 bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-2xl shadow-elevated text-xs animate-in fade-in zoom-in-95"
    >
      {menuItems}
    </div>
  );
};
