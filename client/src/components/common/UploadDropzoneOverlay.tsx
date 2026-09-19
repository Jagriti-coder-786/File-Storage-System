import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { fadeIn } from '../../animations/variants';

interface UploadDropzoneOverlayProps {
  isDragging: boolean;
}

export const UploadDropzoneOverlay: React.FC<UploadDropzoneOverlayProps> = ({ isDragging }) => {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-xl p-12 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border-2 border-dashed border-vault-yellow shadow-glow flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-vault-yellow/20 flex items-center justify-center text-vault-yellow animate-bounce">
              <UploadCloud className="w-10 h-10 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vault-textPrimary dark:text-vault-darkText">
                Drop files to upload
              </h3>
              <p className="text-sm text-vault-textSecondary dark:text-vault-darkMuted mt-1">
                Release your files anywhere to securely upload to CloudVault
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
