import React, { useState, useEffect } from 'react';
import { Clock, Loader2, UploadCloud, Download, Share2, Star, Trash2, Edit2, FileText } from 'lucide-react';
import { fileApi, storageApi } from '../services/api';
import { FileCard } from '../components/file-manager/FileCard';
import { EmptyState } from '../components/common/EmptyState';
import { FilePreviewModal } from '../components/modals/FilePreviewModal';
import { ShareModal } from '../components/modals/ShareModal';
import { FileItem, ActivityItem } from '../types';
import { formatDate } from '../utils/format';
import { apiCache } from '../services/apiCache';

export const RecentPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);

  useEffect(() => {
    const fetchRecent = async () => {
      const cached = apiCache.get<{ files: FileItem[]; activities: ActivityItem[] }>('recent_data');
      if (cached) {
        setFiles(cached.files);
        setActivities(cached.activities);
        setLoading(false);
      }

      try {
        const [filesRes, activitiesRes] = await Promise.all([
          fileApi.getAll({ sortBy: 'createdAt', sortOrder: 'desc', limit: 10 }),
          storageApi.getActivities(20),
        ]);

        if (filesRes.data.success && activitiesRes.data.success) {
          const newFiles = filesRes.data.data.files;
          const newActs = activitiesRes.data.data;
          setFiles(newFiles);
          setActivities(newActs);
          apiCache.set('recent_data', { files: newFiles, activities: newActs });
        }
      } catch (err) {
        console.error('Failed to load recent data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <UploadCloud className="w-3.5 h-3.5 text-vault-yellowDark dark:text-vault-yellow" />;
      case 'DOWNLOAD':
        return <Download className="w-3.5 h-3.5 text-sky-500" />;
      case 'SHARE':
        return <Share2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'STAR':
      case 'UNSTAR':
        return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'DELETE':
        return <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Edit2 className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-vault-border dark:border-vault-darkBorder">
        <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
            Recent Activity
          </h1>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            Review your recently uploaded files and actions across your workspace.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
        </div>
      ) : (
        <>
          {/* Recently Uploaded Files Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted">
              Recently Uploaded
            </h2>
            {files.length === 0 ? (
              <EmptyState type="recent" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {files.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    onPreview={(f) => setPreviewFile(f)}
                    onDownload={(f) => fileApi.download(f._id, f.originalName)}
                    onToggleStar={() => {}}
                    onShare={(f) => setShareFile(f)}
                    onRename={() => {}}
                    onMove={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline Stream */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted">
              Activity History
            </h2>
            <div className="rounded-2xl border border-vault-border dark:border-vault-darkBorder bg-vault-surface dark:bg-vault-darkSurface divide-y divide-vault-border dark:divide-vault-darkBorder overflow-hidden">
              {activities.length === 0 ? (
                <p className="p-6 text-center text-xs text-vault-textSecondary dark:text-vault-darkMuted">
                  No activity history recorded yet.
                </p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act._id}
                    className="flex items-center justify-between p-3.5 text-xs hover:bg-neutral-50 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder">
                        {getActionIcon(act.action)}
                      </div>
                      <div>
                        <p className="font-semibold text-vault-textPrimary dark:text-vault-darkText">
                          {act.action === 'UPLOAD' && 'Uploaded '}
                          {act.action === 'DOWNLOAD' && 'Downloaded '}
                          {act.action === 'DELETE' && 'Moved to trash: '}
                          {act.action === 'RESTORE' && 'Restored '}
                          {act.action === 'STAR' && 'Starred '}
                          {act.action === 'UNSTAR' && 'Unstarred '}
                          {act.action === 'SHARE' && 'Created share link for '}
                          {act.action === 'RENAME' && 'Renamed to '}
                          <span className="font-bold">{act.targetName}</span>
                        </p>
                        <span className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted capitalize">
                          {act.targetType}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
                      {formatDate(act.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={(f) => fileApi.download(f._id, f.originalName)}
        onShare={(f) => setShareFile(f)}
        onToggleStar={() => {}}
      />

      <ShareModal
        file={shareFile}
        onClose={() => setShareFile(null)}
        onUpdated={() => {}}
      />
    </div>
  );
};
