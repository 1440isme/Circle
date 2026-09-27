'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthResponseData, AuthUserData } from '@circle/types';
import {
  getCurrentUserApi,
  loginApi,
  LoginPayload,
  logoutApi,
  registerApi,
  RegisterPayload,
} from '../lib/auth';
import { clearAuthStorage, getStoredTokens, getStoredUser } from '../lib/auth-storage';

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
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const cachedUser = getStoredUser();
      const { accessToken, refreshToken } = getStoredTokens();

      if (cachedUser) {
        setUser(cachedUser);
      }

      if (accessToken || refreshToken) {
        try {
          const freshUser = await getCurrentUserApi();
          if (isMounted) {
            setUser(freshUser);
          }
        } catch (err) {
          // Token invalid or expired
          if (isMounted) {
            setUser(null);
            clearAuthStorage();
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen to global unauthorized broadcast
    const handleUnauthorized = () => {
      setUser(null);
      clearAuthStorage();
    };

    window.addEventListener('circle:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('circle:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await loginApi(payload);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await registerApi(payload);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutApi();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await getCurrentUserApi();
      setUser(freshUser);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
