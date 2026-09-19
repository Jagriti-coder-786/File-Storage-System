import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  UploadCloud,
  FolderPlus,
  Clock,
  Star,
  Trash2,
  PieChart,
  Settings,
  Sun,
  Moon,
  Folder,
  X,
} from 'lucide-react';
import { useViewStore } from '../../store/useViewStore';
import { useTheme } from '../../context/ThemeContext';
import { modalScale } from '../../animations/variants';

interface CommandPaletteProps {
  onOpenUpload?: () => void;
  onOpenNewFolder?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenUpload, onOpenNewFolder }) => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setSearchQuery } = useViewStore();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey listener for Ctrl+K / Cmd+K and Ctrl+U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        onOpenUpload?.();
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen, onOpenUpload]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    {
      id: 'upload',
      title: 'Upload files',
      category: 'Actions',
      icon: UploadCloud,
      run: () => {
        setCommandPaletteOpen(false);
        onOpenUpload?.();
      },
    },
    {
      id: 'new-folder',
      title: 'Create new folder',
      category: 'Actions',
      icon: FolderPlus,
      run: () => {
        setCommandPaletteOpen(false);
        onOpenNewFolder?.();
      },
    },
    {
      id: 'my-files',
      title: 'Go to My Files',
      category: 'Navigation',
      icon: Folder,
      run: () => {
        setCommandPaletteOpen(false);
        navigate('/files');
      },
    },
    {
      id: 'recent',
      title: 'Go to Recent files',
      category: 'Navigation',
      icon: Clock,
      run: () => {
        setCommandPaletteOpen(false);
        navigate('/recent');
      },
    },
    {
      id: 'starred',
      title: 'Go to Starred files',
      category: 'Navigation',
      icon: Star,
      run: () => {
        setCommandPaletteOpen(false);
        navigate('/starred');
      },
    },
    {
      id: 'trash',
      title: 'Go to Trash',
      category: 'Navigation',
      icon: Trash2,
      run: () => {
        setCommandPaletteOpen(false);
        navigate('/trash');
      },
    },
    {
      id: 'storage',
      title: 'Storage & Analytics',
      category: 'Navigation',
      icon: PieChart,
      run: () => {
        setCommandPaletteOpen(false);
        navigate('/storage');
      },
    },
    {
      id: 'settings',
      title: 'Account Settings',
      category: 'Navigation',
      icon: Settings,
      run: () => {
        setCommandPaletteOpen(false);
        navigate('/settings');
      },
    },
    {
      id: 'theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => {
        toggleTheme();
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filtered = actions.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/50 backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <motion.div
        variants={modalScale}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-2xl shadow-elevated overflow-hidden z-10"
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-vault-border dark:border-vault-darkBorder">
          <Search className="w-5 h-5 text-vault-textSecondary dark:text-vault-darkMuted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                setSearchQuery(query.trim());
                setCommandPaletteOpen(false);
                navigate('/files');
              }
            }}
            className="w-full bg-transparent text-sm focus:outline-none text-vault-textPrimary dark:text-vault-darkText placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() && (
            <div
              onClick={() => {
                setSearchQuery(query.trim());
                setCommandPaletteOpen(false);
                navigate('/files');
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-vault-yellow/10 text-vault-yellowDark dark:text-vault-yellow text-sm font-medium transition-colors mb-1"
            >
              <Search className="w-4 h-4" />
              <span>Search files matching "{query}"</span>
            </div>
          )}

          {filtered.length === 0 && !query.trim() ? (
            <p className="py-6 text-center text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              No matching commands found.
            </p>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.run}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText text-sm transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder text-vault-textSecondary dark:text-vault-darkMuted group-hover:text-vault-yellowDark dark:group-hover:text-vault-yellow transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{action.title}</span>
                  </div>
                  <span className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
                    {action.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-vault-bg dark:bg-vault-darkBg border-t border-vault-border dark:border-vault-darkBorder text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
          <span>Navigate with mouse or click an action</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
