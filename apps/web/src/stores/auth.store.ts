import { create } from 'zustand';
import { AuthResponseData, AuthTokens, AuthUserData } from '@circle/types';
import { clearAuthStorage, getStoredTokens, getStoredUser, saveTokens, saveUser } from '../lib/auth-storage';
import { getCurrentUserApi, logoutApi } from '../lib/auth';

interface AuthState {
  user: AuthUserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUserData, tokens: AuthTokens) => void;
  setUser: (user: AuthUserData | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: AuthUserData, tokens: AuthTokens) => {
    saveTokens(tokens);
    saveUser(user);
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user: AuthUserData | null) => {
    if (user) {
      saveUser(user);
      set({ user, isAuthenticated: true });
    } else {
      clearAuthStorage();
      set({ user: null, isAuthenticated: false });
    }
  },

  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutApi();
    } finally {
      clearAuthStorage();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  initAuth: async () => {
    const cachedUser = getStoredUser();
    const { accessToken, refreshToken } = getStoredTokens();

    if (cachedUser) {
      set({ user: cachedUser, isAuthenticated: true });
    }

    if (accessToken || refreshToken) {
      try {
        const freshUser = await getCurrentUserApi();
        set({
          user: freshUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        clearAuthStorage();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
