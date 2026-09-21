import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  Star,
  FileText,
  Music,
  Film,
  Archive,
  File,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { FileItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/format';
import { modalScale } from '../../animations/variants';
import { fileApi, getFileRawUrl } from '../../services/api';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onToggleStar: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  onShare,
  onToggleStar,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  // Direct CDN URL from the server (Cloudinary / S3 / etc.)
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(false);

  useEffect(() => {
    if (!file) {
      setTextContent(null);
      setDirectUrl(null);
      setUrlError(false);
      return;
    }

    // Fetch the direct CDN preview URL from the server
    // This gives us a Cloudinary/S3 URL that can be directly embedded
    // WITHOUT routing through the backend (which causes iframe issues)
    setLoadingUrl(true);
    setUrlError(false);
    setDirectUrl(null);

    fileApi
      .getById(file._id)
      .then((res) => {
        const url = res.data?.data?.previewUrl;
        if (url) {
          setDirectUrl(url);
        } else {
          setUrlError(true);
        }
        setLoadingUrl(false);
      })
      .catch(() => {
        setUrlError(true);
        setLoadingUrl(false);
      });

    // If it's a text / code / json / markdown file, fetch raw content
    const isTextReadable =
      file.category === 'document' &&
      (file.mimeType.includes('text') ||
        file.mimeType.includes('json') ||
        file.originalName.endsWith('.txt') ||
        file.originalName.endsWith('.md') ||
        file.originalName.endsWith('.json') ||
        file.originalName.endsWith('.csv') ||
        file.originalName.endsWith('.js') ||
        file.originalName.endsWith('.ts'));

    if (isTextReadable) {
      setLoadingText(true);
      const token = localStorage.getItem('cloudvault_token');
      const url = getFileRawUrl(file.storageKey, token);
      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Preview fetch failed');
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Failed to load text preview.');
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const renderLoadingState = () => (
    <div className="w-full h-[40vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
      <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">Loading preview…</p>
    </div>
  );

  const renderErrorFallback = () => (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-subtle">
        <AlertTriangle className="w-10 h-10 stroke-[1.5]" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-semibold text-vault-textPrimary dark:text-vault-darkText">
          Preview unavailable
        </p>
        <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
          Unable to generate preview for this file. Download it to view locally.
        </p>
      </div>
      <button
        onClick={() => onDownload(file)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-bold text-xs shadow-subtle transition-transform active:scale-95"
      >
        <Download className="w-4 h-4 stroke-[2.2]" />
        <span>Download File</span>
      </button>
    </div>
  );

  const renderPreviewContent = () => {
    // Images: use direct CDN URL
    if (file.category === 'image') {
      if (loadingUrl) return renderLoadingState();
      if (!directUrl) return renderErrorFallback();
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={directUrl}
            alt={file.originalName}
            className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-sm"
            crossOrigin="anonymous"
          />
        </div>
      );
    }

    // PDFs: use direct CDN URL in iframe
    if (file.mimeType === 'application/pdf' || file.originalName.endsWith('.pdf')) {
      if (loadingUrl) return renderLoadingState();
      if (!directUrl) return renderErrorFallback();
      return (
        <div className="w-full h-[65vh] p-2">
          <iframe
            src={directUrl}
            title={file.originalName}
            className="w-full h-full rounded-xl border border-vault-border dark:border-vault-darkBorder bg-white"
          />
        </div>
      );
    }

    // Videos: use direct CDN URL
    if (file.category === 'video') {
      if (loadingUrl) return renderLoadingState();
      if (!directUrl) return renderErrorFallback();
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <video
            controls
            autoPlay
            className="max-h-[65vh] max-w-full rounded-xl shadow-card"
            crossOrigin="anonymous"
          >
            <source src={directUrl} type={file.mimeType} />
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    // Audio: use direct CDN URL
    if (file.category === 'audio') {
      if (loadingUrl) return renderLoadingState();
      if (!directUrl) return renderErrorFallback();
      return (
        <div className="w-full py-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-subtle">
            <Music className="w-10 h-10 stroke-[1.8]" />
          </div>
          <audio controls className="w-full max-w-md" crossOrigin="anonymous">
            <source src={directUrl} type={file.mimeType} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    // Text-based documents
    if (textContent !== null || loadingText) {
      return (
        <div className="w-full h-[60vh] p-4">
          {loadingText ? (
            renderLoadingState()
          ) : (
            <pre className="w-full h-full p-4 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs overflow-auto leading-relaxed border border-neutral-800 selection:bg-vault-yellow selection:text-black">
              {textContent}
            </pre>
          )}
        </div>
      );
    }

    // Default Fallback for unsupported formats
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-neutral-100 dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder flex items-center justify-center shadow-subtle">
          <File className="w-10 h-10 text-neutral-400 stroke-[1.5]" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-semibold text-vault-textPrimary dark:text-vault-darkText">
            No inline preview available
          </p>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            You can download this file ({formatBytes(file.size)}) to view it locally with your system application.
          </p>
        </div>
        <button
          onClick={() => onDownload(file)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-bold text-xs shadow-subtle transition-transform active:scale-95"
        >
          <Download className="w-4 h-4 stroke-[2.2]" />
          <span>Download File</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        variants={modalScale}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-4xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-3xl shadow-elevated overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vault-border dark:border-vault-darkBorder bg-vault-bg/50 dark:bg-vault-darkBg/50">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText truncate">
                {file.originalName}
              </h3>
              <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
                {formatBytes(file.size)} • {file.mimeType} • Uploaded {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onToggleStar(file)}
              className="p-2 rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
              title="Star"
            >
              <Star
                className={`w-4 h-4 ${
                  file.isStarred
                    ? 'fill-vault-yellow text-vault-yellow'
                    : ''
                }`}
              />
            </button>
            <button
              onClick={() => onShare(file)}
              className="p-2 rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDownload(file)}
              className="p-2 rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textSecondary dark:text-vault-darkMuted hover:text-vault-textPrimary dark:hover:text-vault-darkText transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-vault-bg/30 dark:bg-vault-darkBg/30 flex items-center justify-center">
          {renderPreviewContent()}
        </div>
      </motion.div>
    </div>
  );
};
