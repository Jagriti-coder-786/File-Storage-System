import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Sun,
  Moon,
  HardDrive,
  Keyboard,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { formatBytes } from '../utils/format';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setUpdatingProfile(true);
      const res = await authApi.updateProfile({ name: name.trim() });
      if (res.data.success) {
        updateUser({ name: res.data.data.name });
        success('Profile updated successfully.');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.');
      return;
    }

    try {
      setChangingPass(true);
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res.data.success) {
        success('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-vault-border dark:border-vault-darkBorder">
        <div className="p-2 rounded-xl bg-vault-yellow/20 text-vault-yellowDark dark:text-vault-yellow">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-vault-textPrimary dark:text-vault-darkText">
            Account & Settings
          </h1>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            Manage your personal profile, security credentials, preferences, and shortcuts.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
            <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Personal Information
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2 text-xs bg-neutral-100 dark:bg-neutral-800/60 border border-vault-border dark:border-vault-darkBorder rounded-xl text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-all transform active:scale-95 disabled:opacity-50"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Security / Change Password */}
        <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
            <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Change Password
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPass}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black shadow-subtle transition-all transform active:scale-95 disabled:opacity-50"
              >
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Appearance & Theme Card */}
        <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-vault-yellow" />
              ) : (
                <Sun className="w-4 h-4 text-vault-yellowDark" />
              )}
              <div>
                <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
                  Interface Theme
                </h2>
                <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
                  Currently active: <span className="font-semibold capitalize">{theme} Mode</span>
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl border border-vault-border dark:border-vault-darkBorder hover:bg-neutral-100 dark:hover:bg-vault-darkSurfaceElevated text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText transition-colors"
            >
              Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Storage Quota Card */}
        <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
            <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Storage Allocation
            </h2>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-vault-textSecondary dark:text-vault-darkMuted">
              Current Allocated Quota:
            </span>
            <span className="font-bold text-vault-textPrimary dark:text-vault-darkText">
              {formatBytes(user?.storageQuota || 1073741824)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-vault-textSecondary dark:text-vault-darkMuted">
              Storage Driver:
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Zero-Cost Local Filesystem
            </span>
          </div>
        </div>

        {/* Keyboard Shortcuts Cheat Sheet */}
        <div className="p-6 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-vault-yellowDark dark:text-vault-yellow" />
            <h2 className="text-sm font-bold text-vault-textPrimary dark:text-vault-darkText">
              Keyboard Shortcuts
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { keys: ['Ctrl', 'K'], desc: 'Open Command Palette & instant search' },
              { keys: ['Ctrl', 'U'], desc: 'Trigger file upload dialog' },
              { keys: ['ESC'], desc: 'Close any active preview or modal' },
              { keys: ['Enter'], desc: 'Confirm form action or submit search' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder"
              >
                <span className="text-vault-textSecondary dark:text-vault-darkMuted">{s.desc}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-2 py-1 text-[11px] font-mono font-semibold bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder rounded-md text-vault-textPrimary dark:text-vault-darkText"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
