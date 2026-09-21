import React, { useState } from 'react';
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
import { getFileRawUrl } from '../../services/api';

interface FileCardProps {
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

export const FileCard: React.FC<FileCardProps> = ({
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

  const getCategoryIcon = () => {
    switch (file.category) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-sky-500 stroke-[1.7]" />;
      case 'document':
        return <FileText className="w-8 h-8 text-amber-500 stroke-[1.7]" />;
      case 'video':
        return <Film className="w-8 h-8 text-purple-500 stroke-[1.7]" />;
      case 'audio':
        return <Music className="w-8 h-8 text-emerald-500 stroke-[1.7]" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-rose-500 stroke-[1.7]" />;
      default:
        return <File className="w-8 h-8 text-neutral-400 stroke-[1.7]" />;
    }
  };

  return (
    <div
      onDoubleClick={() => !isTrashView && onPreview(file)}
      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder hover:border-neutral-300 dark:hover:border-neutral-700 shadow-subtle hover:shadow-card transition-all duration-200 select-none cursor-pointer"
    >
      {/* Top row: Star and More button */}
      <div className="flex items-center justify-between mb-3">
        {!isTrashView ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(file);
            }}
            className={`p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors ${
              file.isStarred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                file.isStarred
                  ? 'fill-vault-yellow text-vault-yellow'
                  : 'text-vault-textSecondary dark:text-vault-darkMuted'
              }`}
            />
          </button>
        ) : (
          <div />
        )}

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg opacity-80 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
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
          />
        </div>
      </div>

      {/* Center Icon / Preview Area */}
      <div
        onClick={() => !isTrashView && onPreview(file)}
        className="h-24 flex items-center justify-center rounded-xl bg-vault-bg dark:bg-vault-darkBg mb-3 group-hover:scale-[1.02] transition-transform overflow-hidden"
      >
        {file.category === 'image' && file.mimeType !== 'image/svg+xml' ? (
          <img
            src={getFileRawUrl(file.storageKey)}
            alt={file.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to icon on image error
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          getCategoryIcon()
        )}
      </div>

      {/* Bottom Information */}
      <div className="space-y-1">
        <p
          title={file.originalName}
          className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText truncate group-hover:text-vault-yellowDark dark:group-hover:text-vault-yellow transition-colors"
        >
          {file.originalName}
        </p>
        <div className="flex items-center justify-between text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
          <span>{formatBytes(file.size)}</span>
          <span>{formatDate(file.updatedAt || file.createdAt)}</span>
        </div>
      </div>

      {/* Quick Action Overlay on hover */}
      {!isTrashView && (
        <div className="absolute inset-x-4 bottom-14 hidden group-hover:flex items-center justify-center gap-2 bg-vault-surface/90 dark:bg-vault-darkSurface/90 backdrop-blur-sm p-1.5 rounded-xl border border-vault-border dark:border-vault-darkBorder shadow-sm animate-in fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file);
            }}
            title="Preview"
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText transition-colors"
          >
            <span className="text-[11px] font-medium px-1">Preview</span>
          </button>
          <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-700" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            title="Download"
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(file);
            }}
            title="Share"
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
