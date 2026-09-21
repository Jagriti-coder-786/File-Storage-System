import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Folder,
  Clock,
  Star,
  Trash2,
  PieChart,
  Settings,
  Shield,
  HardDrive,
  Sparkles,
  X,
  UploadCloud,
  FolderPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/format';

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  onOpenUpload?: () => void;
  onOpenNewFolder?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onItemClick,
  showCloseButton = false,
  onClose,
  onOpenUpload,
  onOpenNewFolder,
}) => {
  const { user } = useAuth();

  const navItems = [
    { to: '/files', icon: Folder, label: 'My Files' },
    { to: '/recent', icon: Clock, label: 'Recent' },
    { to: '/starred', icon: Star, label: 'Starred' },
    { to: '/trash', icon: Trash2, label: 'Trash' },
    { to: '/storage', icon: PieChart, label: 'Storage & Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const usedBytes = user?.storageUsed || 0;
  const quotaBytes = user?.storageQuota || 1073741824;
  const usagePercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  return (
    <aside
      className={`w-64 flex flex-col justify-between p-4 bg-vault-surface dark:bg-vault-darkSurface border-r border-vault-border dark:border-vault-darkBorder select-none overflow-y-auto ${className}`}
    >
      <div className="space-y-5">
        {/* Mobile Header with brand & close button if showCloseButton is true */}
        {showCloseButton && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-vault-border dark:border-vault-darkBorder">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-vault-yellow text-black font-black text-base shadow-sm">
                <span>⚡</span>
              </div>
              <span className="font-extrabold text-base tracking-tight text-vault-textPrimary dark:text-vault-darkText">
                Cloud<span className="text-vault-yellowDark dark:text-vault-yellow">Vault</span>
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Quick action buttons on mobile */}
        {(onOpenUpload || onOpenNewFolder) && (
          <div className="grid grid-cols-2 gap-2 pb-1">
            {onOpenUpload && (
              <button
                onClick={() => {
                  onItemClick?.();
                  onOpenUpload();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black text-xs font-bold shadow-subtle transition-transform active:scale-95"
              >
                <UploadCloud className="w-4 h-4 stroke-[2.2]" />
                <span>Upload</span>
              </button>
            )}
            {onOpenNewFolder && (
              <button
                onClick={() => {
                  onItemClick?.();
                  onOpenNewFolder();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-vault-border dark:border-vault-darkBorder bg-vault-bg dark:bg-vault-darkBg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText text-xs font-semibold transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
                <span>New Folder</span>
              </button>
            )}
          </div>
        )}

        {/* Main Navigation Links */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted mb-2">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-vault-yellow text-black font-semibold shadow-subtle'
                        : 'text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Portal link for admin users */}
        {user?.role === 'ADMIN' && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted mb-2">
              Administration
            </p>
            <NavLink
              to="/admin"
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-vault-yellow text-black font-semibold shadow-subtle'
                    : 'text-vault-textPrimary dark:text-vault-darkText hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated'
                }`
              }
            >
              <Shield className="w-4 h-4 stroke-[2.2] text-amber-500" />
              <span>Admin Portal</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Storage Quota Widget at sidebar bottom */}
      <div className="mt-6 p-4 rounded-2xl bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText">
            <HardDrive className="w-3.5 h-3.5 text-vault-yellowDark dark:text-vault-yellow" />
            <span>Cloud Storage</span>
          </div>
          <span className="text-xs font-bold text-vault-textPrimary dark:text-vault-darkText">
            {usagePercent}%
          </span>
        </div>

        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              usagePercent > 85 ? 'bg-rose-500' : 'bg-vault-yellow'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
          <span>{formatBytes(usedBytes)} used</span>
          <span>{formatBytes(quotaBytes)}</span>
        </div>

        {usagePercent > 85 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-500">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Storage nearly full</span>
          </div>
        )}
      </div>
    </aside>
  );
};
