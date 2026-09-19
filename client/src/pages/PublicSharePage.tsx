import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  File,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { publicShareApi } from '../services/api';
import { formatBytes, formatDate } from '../utils/format';
import { modalScale } from '../animations/variants';

export const PublicSharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [file, setFile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    publicShareApi
      .get(token)
      .then((res) => {
        if (res.data.success) {
          setFile(res.data.data);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Shared link is invalid or expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = () => {
    if (token) {
      window.open(publicShareApi.getDownloadUrl(token), '_blank');
    }
  };

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-12 h-12 text-sky-500 stroke-[1.5]" />;
      case 'document':
        return <FileText className="w-12 h-12 text-amber-500 stroke-[1.5]" />;
      case 'video':
        return <Film className="w-12 h-12 text-purple-500 stroke-[1.5]" />;
      case 'audio':
        return <Music className="w-12 h-12 text-emerald-500 stroke-[1.5]" />;
      case 'archive':
        return <Archive className="w-12 h-12 text-rose-500 stroke-[1.5]" />;
      default:
        return <File className="w-12 h-12 text-neutral-400 stroke-[1.5]" />;
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg dark:bg-vault-darkBg flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Top Brand Bar */}
      <header className="w-full max-w-2xl flex items-center justify-between pb-6 border-b border-vault-border dark:border-vault-darkBorder">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-vault-yellow text-black flex items-center justify-center font-extrabold text-sm shadow-sm">
            ⚡
          </div>
          <span className="font-extrabold text-base tracking-tight text-vault-textPrimary dark:text-vault-darkText">
            Cloud<span className="text-vault-yellowDark dark:text-vault-yellow">Vault</span>
          </span>
        </Link>
        <span className="text-xs text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verified Secure Share</span>
        </span>
      </header>

      {/* Main Content Box */}
      <main className="w-full max-w-xl my-auto py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              Decrypting file access token...
            </p>
          </div>
        ) : error ? (
          <motion.div
            variants={modalScale}
            initial="hidden"
            animate="visible"
            className="p-8 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder text-center space-y-4 shadow-elevated"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
                Link Unavailable
              </h2>
              <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
                {error}
              </p>
            </div>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black text-xs font-bold transition-transform active:scale-95"
            >
              Back to Home
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={modalScale}
            initial="hidden"
            animate="visible"
            className="rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-elevated overflow-hidden divide-y divide-vault-border dark:divide-vault-darkBorder"
          >
            {/* Visual Preview / Icon area */}
            <div className="p-8 flex flex-col items-center justify-center text-center bg-vault-bg/40 dark:bg-vault-darkBg/40">
              {file.category === 'image' && file.previewUrl ? (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="max-h-64 max-w-full rounded-2xl object-contain shadow-sm mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder flex items-center justify-center mb-4 shadow-subtle">
                  {getFileIcon(file.category)}
                </div>
              )}

              <h1 className="text-base sm:text-lg font-bold text-vault-textPrimary dark:text-vault-darkText max-w-md break-all">
                {file.name}
              </h1>
              <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted mt-1">
                {formatBytes(file.size)} • {file.mimeType}
              </p>
            </div>

            {/* Metadata Rows */}
            <div className="p-6 space-y-3 bg-vault-surface dark:bg-vault-darkSurface text-xs">
              <div className="flex items-center justify-between text-vault-textSecondary dark:text-vault-darkMuted">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Shared by
                </span>
                <span className="font-semibold text-vault-textPrimary dark:text-vault-darkText">
                  {file.ownerName}
                </span>
              </div>

              <div className="flex items-center justify-between text-vault-textSecondary dark:text-vault-darkMuted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Uploaded on
                </span>
                <span className="font-medium text-vault-textPrimary dark:text-vault-darkText">
                  {formatDate(file.createdAt)}
                </span>
              </div>

              {file.expiresAt && (
                <div className="flex items-center justify-between text-vault-textSecondary dark:text-vault-darkMuted">
                  <span>Expires</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {new Date(file.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              <button
                onClick={handleDownload}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-extrabold text-xs shadow-card transition-all transform active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.2]" />
                <span>Download File ({formatBytes(file.size)})</span>
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-vault-textSecondary dark:text-vault-darkMuted">
        <span>Powered by </span>
        <Link to="/" className="font-bold text-vault-textPrimary dark:text-vault-darkText hover:underline">
          CloudVault
        </Link>
        <span> — "Your files. Your cloud. Your control."</span>
      </footer>
    </div>
  );
};
