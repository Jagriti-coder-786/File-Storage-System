import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  HardDrive,
  Share2,
  Lock,
  Database,
  ArrowRight,
  CheckCircle,
  FolderLock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-vault-bg dark:bg-vault-darkBg text-vault-textPrimary dark:text-vault-darkText selection:bg-vault-yellow selection:text-black">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-vault-border dark:border-vault-darkBorder bg-vault-surface/80 dark:bg-vault-darkSurface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-vault-yellow text-black flex items-center justify-center font-extrabold text-base shadow-sm">
              ⚡
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Cloud<span className="text-vault-yellowDark dark:text-vault-yellow">Vault</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-vault-yellow" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold rounded-xl hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-transform active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vault-yellow/15 border border-vault-yellow/30 text-vault-yellowDark dark:text-vault-yellow text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cloud Storage Reimagined</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Your files. Your cloud.{' '}
            <span className="text-vault-yellowDark dark:text-vault-yellow">Your control.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-vault-textSecondary dark:text-vault-darkMuted leading-relaxed"
          >
            CloudVault combines modern UI aesthetics with pluggable storage infrastructure.
            Upload, preview, organize, and share your files securely with zero cloud vendor lock-in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-extrabold text-sm shadow-card transition-transform active:scale-95"
            >
              <span>Start Storing Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login?demo=1"
              className="px-6 py-3.5 rounded-2xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated font-bold text-sm text-vault-textPrimary dark:text-vault-darkText transition-colors"
            >
              Explore Live Demo
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Preview Graphic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="max-w-5xl mx-auto mt-14 rounded-3xl p-3 bg-neutral-200/50 dark:bg-vault-darkSurface/50 border border-vault-border dark:border-vault-darkBorder shadow-elevated"
        >
          <div className="rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder p-6 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-vault-border dark:border-vault-darkBorder">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-vault-textSecondary dark:text-vault-darkMuted ml-2 font-mono">
                  cloudvault.io/workspace
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-vault-yellow text-black">
                  ACTIVE SESSION
                </span>
              </div>
            </div>

            {/* Folder Grid Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Documents', count: '14 items', color: '#F5C542' },
                { name: 'Branding & Assets', count: '38 items', color: '#38BDF8' },
                { name: 'Q3 Product Specs', count: '9 items', color: '#34D399' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-vault-border dark:border-vault-darkBorder bg-vault-bg dark:bg-vault-darkBg flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${f.color}25` }}
                  >
                    <HardDrive className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{f.name}</p>
                    <p className="text-[10px] text-vault-textSecondary dark:text-vault-darkMuted">
                      {f.count}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Storage Progress Bar */}
            <div className="p-4 rounded-2xl bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Storage Utilization</span>
                <span>124.5 MB / 1.0 GB (12%)</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-vault-yellow rounded-full w-[12%]" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-6 border-t border-vault-border dark:border-vault-darkBorder bg-vault-surface/40 dark:bg-vault-darkSurface/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Engineered for Speed, Security, and Scalability
            </h2>
            <p className="text-xs sm:text-sm text-vault-textSecondary dark:text-vault-darkMuted max-w-xl mx-auto">
              Every feature is built with production rigor — from abstracted object storage engines to instant file previews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold">Pluggable Storage Drivers</h3>
              <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted leading-relaxed">
                Run 100% free locally on your filesystem or switch seamlessly to AWS S3, Cloudflare R2, MinIO, or Backblaze B2 without code changes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold">Expiring Secure Share Links</h3>
              <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted leading-relaxed">
                Share files with colleagues and external clients via cryptographic tokens with automatic expiration and one-click revocation.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow flex items-center justify-center">
                <FolderLock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold">Trash & Accident Recovery</h3>
              <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted leading-relaxed">
                Accidental deletions are preserved safely in the Trash bin. Restore folders and nested files with a single click, or permanently purge them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-vault-border dark:border-vault-darkBorder">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-vault-textSecondary dark:text-vault-darkMuted">
          <div className="flex items-center gap-2">
            <span className="font-bold text-vault-textPrimary dark:text-vault-darkText">CloudVault</span>
            <span>— "Your files. Your cloud. Your control."</span>
          </div>
          <div>Built with React, Express, TypeScript, and Tailwind CSS</div>
        </div>
      </footer>
    </div>
  );
};
