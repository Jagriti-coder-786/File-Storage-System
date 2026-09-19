import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';
import { formatBytes } from '../../utils/format';

export const UploadQueueWidget: React.FC = () => {
  const { queue, isOpen, setIsOpen, removeFromQueue, clearCompleted } = useUploadStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen || queue.length === 0) return null;

  const activeCount = queue.filter((i) => i.status === 'uploading' || i.status === 'pending').length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const totalCount = queue.length;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 sm:w-96 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-elevated overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-vault-bg dark:bg-vault-darkBg border-b border-vault-border dark:border-vault-darkBorder">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Loader2 className="w-4 h-4 text-vault-yellow animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
          )}
          <span className="text-xs font-bold text-vault-textPrimary dark:text-vault-darkText">
            {activeCount > 0
              ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}...`
              : `Uploaded ${completedCount} of ${totalCount} files`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-vault-darkSurface text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              clearCompleted();
              if (activeCount === 0) setIsOpen(false);
            }}
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-vault-darkSurface text-vault-textSecondary dark:text-vault-darkMuted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body items list */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="max-h-64 overflow-y-auto divide-y divide-vault-border dark:divide-vault-darkBorder"
          >
            {queue.map((item) => (
              <div key={item.id} className="p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-vault-textPrimary dark:text-vault-darkText truncate max-w-[200px]">
                    {item.file.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
                      {formatBytes(item.file.size)}
                    </span>
                    {item.status === 'uploading' && (
                      <span className="font-semibold text-vault-yellowDark dark:text-vault-yellow">
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                    {item.status !== 'uploading' && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      item.status === 'error'
                        ? 'bg-rose-500'
                        : item.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-vault-yellow'
                    }`}
                    style={{
                      width: `${item.status === 'completed' ? 100 : item.progress}%`,
                    }}
                  />
                </div>

                {item.error && <p className="text-[11px] text-rose-500 truncate">{item.error}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
