import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cloudvault_token'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('cloudvault_user');
      const savedToken = localStorage.getItem('cloudvault_token');
      if (savedToken && savedUser) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const savedToken = localStorage.getItem('cloudvault_token');
    const savedUser = localStorage.getItem('cloudvault_user');
    // If we already have a valid session cached, don't block the UI with loading spinners
    return !savedToken || !savedUser;
  });

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('cloudvault_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      if (res.data.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('cloudvault_user', JSON.stringify(res.data.data));
      }
    } catch (err: any) {
      // Only clear credentials if the server explicitly rejects the token as unauthorized (401)
      // Never logout on cold starts, temporary network hiccups, or 50x server waking states
      if (err.response?.status === 401) {
        localStorage.removeItem('cloudvault_token');
        localStorage.removeItem('cloudvault_user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Instant cross-tab session synchronization on the same device
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cloudvault_token' || e.key === 'cloudvault_user') {
        const storedToken = localStorage.getItem('cloudvault_token');
        const storedUser = localStorage.getItem('cloudvault_user');
        if (storedToken && storedUser) {
          try {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsLoading(false);
          } catch {
            // ignore
          }
        } else if (!storedToken) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('cloudvault_token', newToken);
    localStorage.setItem('cloudvault_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('cloudvault_token');
    localStorage.removeItem('cloudvault_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updatedFields };
      setUser(updated);
      localStorage.setItem('cloudvault_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
