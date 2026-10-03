'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { AuthResponseData, AuthUserData } from '@circle/types';
import { useAuthStore } from '../stores/auth.store';
import { useLoginMutation, useRegisterMutation, useLogoutMutation } from '../hooks/use-auth-mutations';
import { LoginPayload, RegisterPayload } from '../lib/auth';

import { useLanguageStore } from '../stores/language.store';
import { useThemeStore } from '../stores/theme.store';

interface AuthContextType {
  user: AuthUserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponseData>;
  register: (payload: RegisterPayload) => Promise<AuthResponseData>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initAuth = useAuthStore((s) => s.initAuth);
  const initLanguage = useLanguageStore((s) => s.initLanguage);
  const initTheme = useThemeStore((s) => s.initTheme);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    initLanguage();
    initTheme();
    initAuth();

    const handleUnauthorized = () => {
      useAuthStore.getState().setUser(null);
    };

    window.addEventListener('circle:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('circle:unauthorized', handleUnauthorized);
    };
  }, [initAuth, initLanguage, initTheme]);

  const login = async (payload: LoginPayload) => {
    return loginMutation.mutateAsync(payload);
  };

  const register = async (payload: RegisterPayload) => {
    return registerMutation.mutateAsync(payload);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const refreshUser = async () => {
    await initAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
