import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Shield, User as UserIcon } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { modalScale } from '../animations/variants';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('demo') === '1') {
      setEmail('user@cloudvault.io');
      setPassword('Password123!');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.login({ email: email.trim(), password });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        success('Welcome back to CloudVault!');
        navigate('/files');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      setLoading(true);
      const res = await authApi.login({ email: demoEmail, password: demoPass });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        success(`Logged in as ${res.data.data.user.name}`);
        navigate('/files');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-vault-bg dark:bg-vault-darkBg">
      <motion.div
        variants={modalScale}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-8 rounded-3xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder shadow-elevated space-y-6"
      >
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-vault-yellow text-black font-extrabold text-xl shadow-subtle mb-1">
            ⚡
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight text-vault-textPrimary dark:text-vault-darkText">
            Welcome back to CloudVault
          </h1>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            Enter your credentials to access your secure files.
          </p>
        </div>

        {/* 1-Click Demo Login Shortcuts */}
        <div className="p-3.5 rounded-2xl bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-vault-textSecondary dark:text-vault-darkMuted text-center">
            Instant 1-Click Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('user@cloudvault.io', 'Password123!')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder hover:border-vault-yellow text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText shadow-subtle transition-all"
            >
              <UserIcon className="w-3.5 h-3.5 text-vault-yellowDark dark:text-vault-yellow" />
              <span>Demo User</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@cloudvault.io', 'Admin123!')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-vault-surface dark:bg-vault-darkSurface border border-vault-border dark:border-vault-darkBorder hover:border-vault-yellow text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText shadow-subtle transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin User</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-textSecondary dark:text-vault-darkMuted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ruhi@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-textSecondary dark:text-vault-darkMuted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-extrabold text-xs shadow-card transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-vault-textSecondary dark:text-vault-darkMuted">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-vault-yellowDark dark:text-vault-yellow hover:underline">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
