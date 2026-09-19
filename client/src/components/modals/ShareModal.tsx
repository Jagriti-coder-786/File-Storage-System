import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Link2, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { FileItem } from '../../types';
import { modalScale } from '../../animations/variants';
import { fileApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ShareModalProps {
  file: FileItem | null;
  onClose: () => void;
  onUpdated: (file: FileItem) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, onClose, onUpdated }) => {
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  if (!file) return null;

  const currentShareUrl = file.shareToken
    ? `${window.location.origin}/share/${file.shareToken}`
    : '';

  const handleGenerateShare = async () => {
    try {
      setLoading(true);
      const res = await fileApi.share(file._id, expiryDays > 0 ? expiryDays : undefined);
      if (res.data.success) {
        onUpdated({
          ...file,
          shareEnabled: true,
          shareToken: res.data.data.shareToken,
          shareExpiresAt: res.data.data.shareExpiresAt || undefined,
        });
        success('Share link created successfully.');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    try {
      setLoading(true);
      const res = await fileApi.revokeShare(file._id);
      if (res.data.success) {
        onUpdated({
          ...file,
          shareEnabled: false,
          shareToken: undefined,
          shareExpiresAt: undefined,
        });
        success('Shared link revoked.');
      }
    } catch (err: any) {
      error('Failed to revoke link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (currentShareUrl) {
      navigator.clipboard.writeText(currentShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      success('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        variants={modalScale}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-md bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-3xl shadow-elevated overflow-hidden z-10 p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
                Share File
              </h3>
              <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted truncate max-w-[240px]">
                {file.originalName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {file.shareEnabled && file.shareToken ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText">
                <span>Public Access Link</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentShareUrl}
                  className="w-full px-3 py-2 text-xs bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none text-vault-textPrimary dark:text-vault-darkText select-all font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-all transform active:scale-95 flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {file.shareExpiresAt && (
                <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>Expires: {new Date(file.shareExpiresAt).toLocaleDateString()}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleRevokeShare}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke Share Link</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText">
                Link Expiration
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
              >
                <option value={1}>1 Day</option>
                <option value={7}>7 Days (Recommended)</option>
                <option value={30}>30 Days</option>
                <option value={0}>Never Expire</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-vault-darkBg text-vault-textSecondary dark:text-vault-darkMuted text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                Anyone with this link will be able to view and download the file. You can revoke access at any time.
              </span>
            </div>

            <button
              onClick={handleGenerateShare}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-bold text-xs shadow-subtle transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Create Share Link'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
