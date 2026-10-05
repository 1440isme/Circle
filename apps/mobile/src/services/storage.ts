import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthTokens, AuthUserData } from '@circle/types';

const ACCESS_TOKEN_KEY = 'circle_access_token';
const REFRESH_TOKEN_KEY = 'circle_refresh_token';
const USER_DATA_KEY = 'circle_user_data';

// In-memory fallback for non-native platforms (e.g. web preview)
const memoryStore = new Map<string, string>();

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStore.get(key) || null;
  }
  return await SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  await setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const accessToken = await getItem(ACCESS_TOKEN_KEY);
  const refreshToken = await getItem(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
}

export async function clearAuthTokens(): Promise<void> {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(USER_DATA_KEY);
}

export async function saveUserData(user: AuthUserData): Promise<void> {
  await setItem(USER_DATA_KEY, JSON.stringify(user));
}

export async function getUserData(): Promise<AuthUserData | null> {
  const raw = await getItem(USER_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserData;
  } catch {
    return null;
  }
}
