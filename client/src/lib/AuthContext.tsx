'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Player } from '@/lib/types';
import api from '@/lib/api';

interface AuthContextType {
  player: Player | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshPlayer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const data = await api.verify();
      if (data.player) {
        setPlayer(data.player);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setPlayer(data.player);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const data = await api.register(username, email, password);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setPlayer(data.player);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setPlayer(null);
  };

  const refreshPlayer = async () => {
    const data = await api.getProfile();
    if (data && !data.error) {
      setPlayer(data);
    }
  };

  return (
    <AuthContext.Provider value={{ player, loading, login, register, logout, refreshPlayer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
