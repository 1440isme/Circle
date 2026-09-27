import { AuthTokens, AuthUserData } from '@circle/types';
import { deleteCookie, getCookie, setCookie } from './cookies';

const ACCESS_TOKEN_KEY = 'circle_access_token';
const REFRESH_TOKEN_KEY = 'circle_refresh_token';
const USER_KEY = 'circle_user';

export interface StoredAuthData {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUserData | null;
}

export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || getCookie(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || getCookie(REFRESH_TOKEN_KEY);

  return { accessToken, refreshToken };
}

export function getStoredUser(): AuthUserData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  // Set cookies for Next.js middleware & SSR awareness
  setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, 1); // 1 day
  setCookie(REFRESH_TOKEN_KEY, tokens.refreshToken, 7); // 7 days
}

export function saveUser(user: AuthUserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}
