import React, { useState, useRef, useEffect } from 'react';
import { Folder, MoreVertical, Edit2, FolderInput, Trash2 } from 'lucide-react';
import { FolderItem } from '../../types';

interface FolderCardProps {
  folder: FolderItem;
  onClick: (folder: FolderItem) => void;
  onRename: (folder: FolderItem) => void;
  onMove: (folder: FolderItem) => void;
  onDelete: (folder: FolderItem) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onClick,
  onRename,
  onMove,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={() => onClick(folder)}
      className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder hover:border-neutral-300 dark:hover:border-neutral-700 shadow-subtle hover:shadow-card transition-all duration-200 cursor-pointer select-none"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${folder.color || '#F5C542'}20` }}
        >
          <Folder
            className="w-5 h-5 stroke-[2]"
            style={{ color: folder.color || '#DFAF24' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText truncate group-hover:text-vault-yellowDark dark:group-hover:text-vault-yellow transition-colors">
            {folder.name}
          </p>
          <span className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
            Folder
          </span>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 rounded-lg opacity-80 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 z-30 w-40 p-1 bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-xl shadow-elevated text-xs animate-in fade-in zoom-in-95">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onRename(folder);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
              <span>Rename</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onMove(folder);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
              <span>Move folder</span>
            </button>
            <div className="h-px my-1 bg-vault-border dark:bg-vault-darkBorder" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(folder);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete folder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
