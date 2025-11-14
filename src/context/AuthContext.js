import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getItem } from '../services/storage';
import { getProfile, login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getItem('accessToken');
        if (token) {
          const profile = await getProfile();
          if (mounted) setUser(profile?.user || profile);
        }
      } catch (e) {
        // ignore errors during bootstrap
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    initializing,
    role: user?.role,
    async login(email, password) {
      const u = await apiLogin(email, password);
      setUser(u);
    },
    async register(payload) {
      const u = await apiRegister(payload);
      setUser(u);
    },
    async logout() {
      await apiLogout();
      setUser(null);
    },
  }), [user, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}