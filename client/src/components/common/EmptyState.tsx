import React from 'react';
import { FolderOpen, Star, Trash2, Search, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  type: 'files' | 'trash' | 'starred' | 'search' | 'recent' | 'general';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'trash':
        return <Trash2 className="w-10 h-10 text-neutral-400 stroke-[1.5]" />;
      case 'starred':
        return <Star className="w-10 h-10 text-vault-yellow stroke-[1.5]" />;
      case 'search':
        return <Search className="w-10 h-10 text-neutral-400 stroke-[1.5]" />;
      case 'files':
      case 'recent':
        return <FolderOpen className="w-10 h-10 text-vault-yellowDark dark:text-vault-yellow stroke-[1.5]" />;
      default:
        return <FileQuestion className="w-10 h-10 text-neutral-400 stroke-[1.5]" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'trash':
        return 'Trash is empty';
      case 'starred':
        return 'No starred items yet';
      case 'search':
        return 'No files match your search';
      case 'files':
        return 'This folder is empty';
      case 'recent':
        return 'No recent activity';
      default:
        return 'No items found';
    }
  };

  const getDefaultDesc = () => {
    switch (type) {
      case 'trash':
        return 'Items moved to trash will appear here before being permanently removed.';
      case 'starred':
        return 'Star your most important files to quickly access them from here anytime.';
      case 'search':
        return 'Try checking for typos or searching for a broader term or extension.';
      case 'files':
        return 'Upload files or create subfolders to get organized.';
      case 'recent':
        return 'Files you upload, open, or modify will show up here.';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-neutral-100 dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder flex items-center justify-center mb-4 shadow-subtle">
        {getIcon()}
      </div>
      <h3 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
        {title || getDefaultTitle()}
      </h3>
      <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted max-w-sm mt-1.5 leading-relaxed">
        {description || getDefaultDesc()}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-transform active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
