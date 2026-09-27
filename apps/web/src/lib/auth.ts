import { AuthResponseData, AuthUserData } from '@circle/types';
import { apiRequest } from './api';
import { clearAuthStorage, getStoredTokens, saveTokens, saveUser } from './auth-storage';

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Register a new user account.
 */
export async function registerApi(payload: RegisterPayload): Promise<AuthResponseData> {
  const res = await apiRequest<AuthResponseData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  saveTokens(res.data.tokens);
  saveUser(res.data.user);

  return res.data;
}

/**
 * Login with email and password.
 */
export async function loginApi(payload: LoginPayload): Promise<AuthResponseData> {
  const res = await apiRequest<AuthResponseData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  saveTokens(res.data.tokens);
  saveUser(res.data.user);

  return res.data;
}

/**
 * Fetch current user profile from /auth/me.
 */
export async function getCurrentUserApi(): Promise<AuthUserData> {
  const res = await apiRequest<AuthUserData>('/auth/me', {
    method: 'GET',
  });

  saveUser(res.data);
  return res.data;
}

/**
 * Logout current session.
 */
export async function logoutApi(): Promise<void> {
  const { refreshToken } = getStoredTokens();
  try {
    await apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshToken || undefined }),
    });
  } catch {
    // Silently continue clearing local state even if backend is unreachable
  } finally {
    clearAuthStorage();
  }
}
