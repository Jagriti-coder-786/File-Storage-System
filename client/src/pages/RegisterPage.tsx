import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { modalScale } from '../animations/variants';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        success('Account created successfully! Welcome to CloudVault.');
        navigate('/files');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Registration failed.');
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
            Create your CloudVault
          </h1>
          <p className="text-xs text-vault-textSecondary dark:text-vault-darkMuted">
            Get 1 GB of free, secure cloud storage in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-vault-textPrimary dark:text-vault-darkText block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-textSecondary dark:text-vault-darkMuted" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
              />
            </div>
          </div>

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
                placeholder="alex@company.com"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-vault-bg dark:bg-vault-darkBg border border-vault-border dark:border-vault-darkBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-vault-yellow text-vault-textPrimary dark:text-vault-darkText"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-yellow hover:bg-vault-yellowHover text-black font-extrabold text-xs shadow-card transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Sign Up Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-vault-textSecondary dark:text-vault-darkMuted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-vault-yellowDark dark:text-vault-yellow hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
