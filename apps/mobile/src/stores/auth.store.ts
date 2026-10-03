import { create } from 'zustand';
import { AuthTokens, AuthUserData, AuthResponseData } from '@circle/types';
import { UpdateProfileInput } from '@circle/shared';
import {
  getAuthTokens,
  saveAuthTokens,
  clearAuthTokens,
  getUserData,
  saveUserData,
} from '../services/storage';
import { mobileApiRequest } from '../services/api';

interface AuthState {
  user: AuthUserData | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initAuth: () => Promise<void>;
  setAuth: (user: AuthUserData, tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (dto: UpdateProfileInput) => Promise<AuthUserData>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      const storedTokens = await getAuthTokens();
      const storedUser = await getUserData();

      if (storedTokens.accessToken && storedTokens.refreshToken && storedUser) {
        set({
          tokens: {
            accessToken: storedTokens.accessToken,
            refreshToken: storedTokens.refreshToken,
            expiresIn: 900,
          },
          user: storedUser,
          isAuthenticated: true,
          isLoading: false,
        });

        // Optionally fetch fresh profile in background
        get().refreshProfile().catch(() => {});
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  setAuth: async (user: AuthUserData, tokens: AuthTokens) => {
    await saveAuthTokens(tokens);
    await saveUserData(user);
    set({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      const { tokens } = get();
      if (tokens?.refreshToken) {
        await mobileApiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          skipAuth: true,
        }).catch(() => {});
      }
    } finally {
      await clearAuthTokens();
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

    refreshProfile: async () => {
    try {
      const res = await mobileApiRequest<AuthUserData>('/auth/me', {
        method: 'GET',
      });
      if (res.data) {
        await saveUserData(res.data);
        set({ user: res.data });
      }
    } catch (err: any) {
      if (err?.statusCode === 401) {
        await get().logout();
      }
    }
  },

  updateProfile: async (dto: UpdateProfileInput) => {
    const res = await mobileApiRequest<AuthUserData>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    if (res.data) {
      await saveUserData(res.data);
      set({ user: res.data });
    }
    return res.data;
  },
}));
