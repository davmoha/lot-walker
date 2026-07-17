import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Company } from '../types';
import api from '../lib/api';

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (dealer_code: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('lw_user') || 'null'); } catch { return null; }
  });
  const [company, setCompany] = useState<Company | null>(() => {
    try { return JSON.parse(localStorage.getItem('lw_company') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lw_token'));

  const login = useCallback(async (dealer_code: string, email: string, password: string) => {
    const { data } = await api.post('/auth/login', { dealer_code, email, password });
    localStorage.setItem('lw_token', data.token);
    localStorage.setItem('lw_user', JSON.stringify(data.user));
    localStorage.setItem('lw_company', JSON.stringify(data.company));
    setToken(data.token);
    setUser(data.user);
    setCompany(data.company);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lw_token');
    localStorage.removeItem('lw_user');
    localStorage.removeItem('lw_company');
    setToken(null);
    setUser(null);
    setCompany(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, company, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
