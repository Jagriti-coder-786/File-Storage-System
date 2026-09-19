import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  HardDrive,
  File,
  Search,
  CheckCircle,
  AlertCircle,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatDate } from '../utils/format';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [fileSearch, setFileSearch] = useState('');

  const { success, error } = useToast();

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, filesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({ search: userSearch || undefined, limit: 15 }),
        adminApi.getFiles({ search: fileSearch || undefined, limit: 15 }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data.users);
      if (filesRes.data.success) setFiles(filesRes.data.data.files);
    } catch (err) {
      error('Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [userSearch, fileSearch]);

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await adminApi.updateUser(userId, { role: newRole });
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        success(`User role changed to ${newRole}`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminApi.updateUser(userId, { status: newStatus });
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
        );
        success(`User status updated to ${newStatus}`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Permanently delete this file from the system?')) return;
    try {
      const res = await adminApi.deleteFile(fileId);
      if (res.data.success) {
        setFiles((prev) => prev.filter((f) => f._id !== fileId));
        success('File purged from system.');
      }
    } catch {
      error('Failed to delete file.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-vault-border dark:border-vault-darkBorder">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
              Administrator Portal
            </h1>
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              Manage users, audit system-wide files, and monitor cluster performance.
            </p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-vault-border dark:border-vault-darkBorder text-xs hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-vault-textPrimary dark:text-vault-darkText transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-500" /> Total Users
            </span>
            <p className="text-2xl font-black text-vault-textPrimary dark:text-vault-darkText">
              {stats.metrics.totalUsers}
            </p>
            <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
              {stats.metrics.activeUsers} active accounts
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1.5">
              <File className="w-4 h-4 text-amber-500" /> Total Files
            </span>
            <p className="text-2xl font-black text-vault-textPrimary dark:text-vault-darkText">
              {stats.metrics.totalFiles}
            </p>
            <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
              Stored across all users
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-500" /> Total Storage
            </span>
            <p className="text-2xl font-black text-vault-textPrimary dark:text-vault-darkText">
              {formatBytes(stats.metrics.totalStorageUsed)}
            </p>
            <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
              Physical object footprint
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-1">
            <span className="text-xs font-semibold text-vault-textSecondary dark:text-vault-darkMuted flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-vault-yellow" /> Storage Driver
            </span>
            <p className="text-base font-extrabold text-vault-textPrimary dark:text-vault-darkText pt-1">
              Zero-Cost Local Disk
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ● Connected & healthy
            </p>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Registered Users
            </h2>
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              Manage accounts, quotas, and permission roles.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-vault-border dark:border-vault-darkBorder text-vault-textSecondary dark:text-vault-darkMuted">
                <th className="py-2.5 px-3 font-semibold">User</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Storage Used</th>
                <th className="py-2.5 px-3 font-semibold">Registered</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-border dark:divide-vault-darkBorder">
              {users.map((u) => {
                const percent = Math.min(100, Math.round((u.storageUsed / u.storageQuota) * 100));
                return (
                  <tr
                    key={u._id}
                    className="hover:bg-neutral-50 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
                  >
                    <td className="py-3 px-3">
                      <p className="font-semibold text-vault-textPrimary dark:text-vault-darkText">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-vault-textSecondary dark:text-vault-darkMuted">
                        {u.email}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-vault-yellow text-black'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-vault-textPrimary dark:text-vault-darkText'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.status === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {u.status === 'active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[10px] text-vault-textSecondary dark:text-vault-darkMuted">
                          <span>{formatBytes(u.storageUsed)}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 85 ? 'bg-rose-500' : 'bg-vault-yellow'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-vault-textSecondary dark:text-vault-darkMuted">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateRole(u._id, u.role)}
                          className="px-2 py-1 rounded-lg border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[11px] font-medium transition-colors"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u._id, u.status)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                            u.status === 'active'
                              ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global File Audit Section */}
      <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Global File Audit
            </h2>
            <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
              Audit files uploaded to the platform and remove violating content.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vault-textSecondary dark:text-vault-darkMuted" />
            <input
              type="text"
              placeholder="Search by file name..."
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-vault-border dark:border-vault-darkBorder text-vault-textSecondary dark:text-vault-darkMuted">
                <th className="py-2.5 px-3 font-semibold">File</th>
                <th className="py-2.5 px-3 font-semibold">Owner</th>
                <th className="py-2.5 px-3 font-semibold">Size</th>
                <th className="py-2.5 px-3 font-semibold">MIME Type</th>
                <th className="py-2.5 px-3 font-semibold">Uploaded</th>
                <th className="py-2.5 px-3 font-semibold text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-border dark:divide-vault-darkBorder">
              {files.map((file) => (
                <tr
                  key={file._id}
                  className="hover:bg-neutral-50 dark:hover:bg-vault-darkSurfaceElevated transition-colors"
                >
                  <td className="py-3 px-3">
                    <p className="font-semibold text-vault-textPrimary dark:text-vault-darkText truncate max-w-xs">
                      {file.originalName}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-vault-textSecondary dark:text-vault-darkMuted">
                    {file.ownerId?.name || 'Unknown User'}
                  </td>
                  <td className="py-3 px-3 font-mono">{formatBytes(file.size)}</td>
                  <td className="py-3 px-3 text-vault-textSecondary dark:text-vault-darkMuted truncate max-w-[150px]">
                    {file.mimeType}
                  </td>
                  <td className="py-3 px-3 text-vault-textSecondary dark:text-vault-darkMuted">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Permanently remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
