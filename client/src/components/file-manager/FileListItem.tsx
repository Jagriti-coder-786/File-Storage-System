import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  File,
  MoreVertical,
  Star,
  Download,
  Share2,
} from 'lucide-react';
import { FileItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/format';
import { FileContextMenu } from './FileContextMenu';

interface FileListItemProps {
  file: FileItem;
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

export const FileListItem: React.FC<FileListItemProps> = ({
  file,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const getCategoryIcon = () => {
    switch (file.category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-sky-500 stroke-[1.8]" />;
      case 'document':
        return <FileText className="w-5 h-5 text-amber-500 stroke-[1.8]" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-500 stroke-[1.8]" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-500 stroke-[1.8]" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-rose-500 stroke-[1.8]" />;
      default:
        return <File className="w-5 h-5 text-neutral-400 stroke-[1.8]" />;
    }
  };

  return (
    <div
      onDoubleClick={() => !isTrashView && onPreview(file)}
      className="group flex items-center justify-between px-4 py-3 rounded-xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-vault-darkSurfaceElevated text-xs transition-colors select-none cursor-pointer"
    >
      {/* File name & Icon */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {!isTrashView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(file);
            }}
            aria-label={file.isStarred ? 'Remove from starred' : 'Add to starred'}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex-shrink-0 active:scale-95"
          >
            <Star
              className={`w-4 h-4 ${
                file.isStarred
                  ? 'fill-vault-yellow text-vault-yellow'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            />
          </button>
        )}

        <div className="p-2 rounded-lg bg-vault-bg dark:bg-vault-darkBg flex-shrink-0">
          {getCategoryIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <p
            onClick={() => !isTrashView && onPreview(file)}
            className="font-medium text-vault-textPrimary dark:text-vault-darkText truncate group-hover:text-vault-yellowDark dark:group-hover:text-vault-yellow transition-colors"
          >
            {file.originalName}
          </p>
          <span className="inline-block sm:hidden text-[11px] text-vault-textSecondary dark:text-vault-darkMuted mt-0.5">
            {formatBytes(file.size)} • {formatDate(file.updatedAt || file.createdAt)}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="hidden md:block w-28 text-vault-textSecondary dark:text-vault-darkMuted capitalize">
        {file.category}
      </div>

      {/* Size */}
      <div className="hidden sm:block w-24 text-right text-vault-textSecondary dark:text-vault-darkMuted font-mono">
        {formatBytes(file.size)}
      </div>

      {/* Date */}
      <div className="hidden lg:block w-36 text-right text-vault-textSecondary dark:text-vault-darkMuted">
        {formatDate(file.updatedAt || file.createdAt)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        {!isTrashView && (
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file);
              }}
              title="Download"
              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(file);
              }}
              title="Share"
              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative">
          <button
            ref={menuBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <FileContextMenu
            file={file}
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onPreview={onPreview}
            onDownload={onDownload}
            onToggleStar={onToggleStar}
            onShare={onShare}
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
            isTrashView={isTrashView}
            anchorRef={menuBtnRef}
          />
        </div>
      </div>
    </div>
  );
};
