import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-vault-textSecondary dark:text-vault-darkMuted overflow-x-auto py-1">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>My Files</span>
      </button>

      {items.map((crumb, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={crumb.id || idx}>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-vault-textPrimary dark:text-vault-darkText truncate max-w-[160px]">
                {crumb.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(crumb.id)}
                className="hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors truncate max-w-[140px]"
              >
                {crumb.name}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
