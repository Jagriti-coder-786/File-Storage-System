import React, { useState, useEffect } from 'react';
import {
  PieChart as PieChartIcon,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  File,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { storageApi } from '../services/api';
import { formatBytes } from '../utils/format';
import { StorageSummary } from '../types';

const CATEGORY_COLORS = {
  documents: '#F5C542', // Warm Yellow
  images: '#38BDF8',    // Sky Blue
  videos: '#A855F7',    // Purple
  audio: '#34D399',     // Emerald Green
  archives: '#F43F5E',  // Rose
  other: '#9CA3AF',     // Gray
};

export const StorageAnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        setLoading(true);
        const res = await storageApi.getSummary();
        if (res.data.success) {
          setSummary(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load storage summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStorage();
  }, []);

  if (loading || !summary) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
      </div>
    );
  }

  const chartData = [
    { name: 'Documents', value: summary.categoryBreakdown.documents, color: CATEGORY_COLORS.documents },
    { name: 'Images', value: summary.categoryBreakdown.images, color: CATEGORY_COLORS.images },
    { name: 'Videos', value: summary.categoryBreakdown.videos, color: CATEGORY_COLORS.videos },
    { name: 'Audio', value: summary.categoryBreakdown.audio, color: CATEGORY_COLORS.audio },
    { name: 'Archives', value: summary.categoryBreakdown.archives, color: CATEGORY_COLORS.archives },
    { name: 'Other', value: summary.categoryBreakdown.other, color: CATEGORY_COLORS.other },
  ].filter((item) => item.value > 0);

  // If no files at all, show a placeholder segment in donut
  const displayChartData =
    chartData.length > 0
      ? chartData
      : [{ name: 'Free Space', value: summary.totalQuota, color: '#E8E6DF' }];

  const categories = [
    {
      label: 'Documents',
      icon: FileText,
      size: summary.categoryBreakdown.documents,
      color: CATEGORY_COLORS.documents,
    },
    {
      label: 'Images',
      icon: ImageIcon,
      size: summary.categoryBreakdown.images,
      color: CATEGORY_COLORS.images,
    },
    {
      label: 'Videos',
      icon: Film,
      size: summary.categoryBreakdown.videos,
      color: CATEGORY_COLORS.videos,
    },
    {
      label: 'Audio',
      icon: Music,
      size: summary.categoryBreakdown.audio,
      color: CATEGORY_COLORS.audio,
    },
    {
      label: 'Archives',
      icon: Archive,
      size: summary.categoryBreakdown.archives,
      color: CATEGORY_COLORS.archives,
    },
    {
      label: 'Other',
      icon: File,
      size: summary.categoryBreakdown.other,
      color: CATEGORY_COLORS.other,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-vault-border dark:border-vault-darkBorder">
        <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
          <PieChartIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
            Storage & Analytics
          </h1>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            Detailed breakdown of your cloud disk consumption and file categories.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted">
              Storage Used
            </span>
            <HardDrive className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
          </div>
          <p className="text-xl font-extrabold text-vault-textPrimary dark:text-vault-darkText">
            {formatBytes(summary.usedStorage)}
          </p>
          <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
            {summary.usagePercentage}% of {formatBytes(summary.totalQuota)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted">
              Available Space
            </span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-vault-textPrimary dark:text-vault-darkText">
            {formatBytes(summary.availableStorage)}
          </p>
          <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
            Free space on your account
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted">
              Total Files
            </span>
            <File className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-extrabold text-vault-textPrimary dark:text-vault-darkText">
            {summary.totalFiles}
          </p>
          <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
            Stored in your cloud vault
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted">
              Storage Tier
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
              FREE
            </span>
          </div>
          <p className="text-xl font-extrabold text-vault-textPrimary dark:text-vault-darkText">
            {formatBytes(summary.totalQuota)}
          </p>
          <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
            Standard development quota
          </p>
        </div>
      </div>

      {/* Recharts Donut & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted mb-2 self-start">
            Disk Usage Breakdown
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayChartData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatBytes(Number(value))}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E8E6DF',
                    backgroundColor: '#171717',
                    color: '#FAFAF8',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-2xl font-black text-vault-textPrimary dark:text-vault-darkText">
              {summary.usagePercentage}%
            </p>
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              Storage Capacity Utilized
            </p>
          </div>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted">
            File Categories
          </h3>
          <div className="space-y-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const percent =
                summary.usedStorage > 0
                  ? Math.round((cat.size / summary.usedStorage) * 100)
                  : 0;

              return (
                <div key={cat.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}25` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      </div>
                      <span className="font-semibold text-vault-textPrimary dark:text-vault-darkText">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-vault-textSecondary dark:text-vault-darkMuted font-mono">
                        {formatBytes(cat.size)}
                      </span>
                      <span className="text-[11px] font-bold text-vault-textPrimary dark:text-vault-darkText w-8 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-vault-bg dark:bg-vault-darkBg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
