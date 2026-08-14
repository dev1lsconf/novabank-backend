"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading, logout: logoutStore } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      if (api.isAuthenticated() && !user) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          setAuthenticated(true);
        } catch {
          api.clearTokens();
          setUser(null);
          setAuthenticated(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, [user, setUser, setAuthenticated, setLoading]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.user);
    setAuthenticated(true);
    return response;
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; nationalId: string }) => {
    const response = await api.register(data);
    setUser(response.user);
    setAuthenticated(true);
    return response;
  };

  const logout = async () => {
    await api.logout();
    logoutStore();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
