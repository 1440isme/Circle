import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ApiResponse, AuthResponseData, AuthTokens } from '@circle/types';
import { getAuthTokens, saveAuthTokens, clearAuthTokens } from './storage';
import { useLanguageStore } from '../stores/language.store';

function getDefaultApiUrl(): string {
  // 1. Explicit environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
  }

  // 2. Configured in app.json extra
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) {
    const url = extraUrl.replace(/\/+$/, '');
    return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
  }

  // 3. Dynamically extract Metro dev server IP when running via Expo Go on physical device
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    Constants.linkingUri?.replace(/^exp:\/\//, '').split('/')[0];

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api/v1`;
    }
  }

  // 4. Android Emulator loopback (only when running on emulator and no LAN host extracted)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }

  // 5. Default fallback to machine current LAN IP for physical mobile testing
  return 'http://192.168.1.187:4000/api/v1';
}

export const API_BASE_URL = getDefaultApiUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

async function silentRefreshToken(): Promise<string> {
  const { refreshToken } = await getAuthTokens();
  if (!refreshToken) {
    throw new ApiError('No refresh token available', 401);
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const t = useLanguageStore.getState().t;

  const data: ApiResponse<AuthResponseData> = await response.json();
  if (!response.ok || !data.data?.tokens) {
    await clearAuthTokens();
    throw new ApiError(data.message || t.common.sessionExpired, response.status);
  }

  await saveAuthTokens(data.data.tokens);
  return data.data.tokens.accessToken;
}

export async function mobileApiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth = false, retryCount = 0, headers = {}, ...customConfig } = options;
  const t = useLanguageStore.getState().t;

  const currentLocale = useLanguageStore.getState().locale;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-circle-locale': currentLocale,
    'Accept-Language': currentLocale,
  };

  if (!skipAuth) {
    const { accessToken } = await getAuthTokens();
    if (accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
    });
  } catch (err: any) {
    throw new ApiError(
      t.common.networkError,
      0,
      err,
    );
  }

  // Handle 401 Silent Refresh
  if (response.status === 401 && !skipAuth && retryCount === 0) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newAccessToken = await silentRefreshToken();
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        return mobileApiRequest<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
        });
      } catch (refreshErr) {
        isRefreshing = false;
        onTokenRefreshed(null);
        throw refreshErr;
      }
    }

    return new Promise((resolve, reject) => {
      addRefreshSubscriber((newToken) => {
        if (!newToken) {
          return reject(new ApiError(t.common.sessionExpired, 401));
        }
        resolve(
          mobileApiRequest<T>(endpoint, {
            ...options,
            retryCount: retryCount + 1,
          }),
        );
      });
    });
  }

  const resData: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const rawDetails = (resData as any)?.details;
    const message =
      resData?.message ||
      (Array.isArray(rawDetails) ? rawDetails[0] : t.common.unknownError);
    throw new ApiError(message, response.status, resData);
  }

  return resData;
}
