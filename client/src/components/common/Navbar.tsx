import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  UploadCloud,
  FolderPlus,
  Sun,
  Moon,
  Shield,
  LogOut,
  User,
  Settings,
  HardDrive,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useViewStore } from '../../store/useViewStore';
import { formatBytes } from '../../utils/format';

interface NavbarProps {
  onOpenUpload?: () => void;
  onOpenNewFolder?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUpload, onOpenNewFolder }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery, setCommandPaletteOpen } = useViewStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const usedBytes = user?.storageUsed || 0;
  const quotaBytes = user?.storageQuota || 1073741824;
  const usagePercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-vault-surface/80 dark:bg-vault-darkSurface/80 backdrop-blur-md border-b border-vault-border dark:border-vault-darkBorder">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <Link to="/files" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-vault-yellow text-black shadow-sm font-black text-lg transition-transform group-hover:scale-105">
            <span className="leading-none">⚡</span>
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-vault-textPrimary dark:text-vault-darkText">
              Cloud<span className="text-vault-yellowDark dark:text-vault-yellow">Vault</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-xl mx-4 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-textSecondary dark:text-vault-darkMuted" />
          <input
            type="text"
            placeholder="Search files, documents, media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2 text-sm bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow focus:border-transparent text-vault-textPrimary dark:text-vault-darkText placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-vault-textSecondary dark:text-vault-darkMuted bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-md hover:border-neutral-400 transition-colors"
          >
            <Command className="w-3 h-3" /> K
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* New Folder Button */}
        {onOpenNewFolder && (
          <button
            onClick={onOpenNewFolder}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors text-vault-textPrimary dark:text-vault-darkText"
          >
            <FolderPlus className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
            <span>New Folder</span>
          </button>
        )}

        {/* Upload Button */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-all transform active:scale-95"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.2]" />
            <span>Upload</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-vault-yellow" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-vault-border dark:border-vault-darkBorder flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-2xl shadow-elevated z-50 animate-in fade-in zoom-in-95">
              <div className="p-2.5 border-b border-vault-border dark:border-vault-darkBorder mb-1">
                <p className="font-semibold text-sm text-vault-textPrimary dark:text-vault-darkText truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted truncate">
                  {user?.email}
                </p>
                {user?.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
                    <Shield className="w-3 h-3" /> ADMIN
                  </span>
                )}
              </div>

              {/* Storage Quick Info */}
              <div className="p-2.5 bg-vault-bg dark:bg-vault-darkBg rounded-xl mb-1.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> Storage
                  </span>
                  <span className="font-medium text-vault-textPrimary dark:text-vault-darkText">
                    {usagePercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      usagePercent > 85 ? 'bg-rose-500' : 'bg-vault-yellow'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted mt-1">
                  {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
                </p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account & Settings</span>
                </button>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-yellowDark dark:text-vault-yellow transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Portal</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
