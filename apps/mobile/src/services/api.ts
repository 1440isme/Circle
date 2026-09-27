import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ApiResponse, AuthResponseData, AuthTokens } from '@circle/types';
import { getAuthTokens, saveAuthTokens, clearAuthTokens } from './storage';

function getDefaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Configured in app.json extra or dev defaults
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) return extraUrl;

  // In Android Emulator, localhost is 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }
  return 'http://localhost:4000';
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

  const data: ApiResponse<AuthResponseData> = await response.json();
  if (!response.ok || !data.data?.tokens) {
    await clearAuthTokens();
    throw new ApiError(data.message || 'Phiên đăng nhập hết hạn', response.status);
  }

  await saveAuthTokens(data.data.tokens);
  return data.data.tokens.accessToken;
}

export async function mobileApiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth = false, retryCount = 0, headers = {}, ...customConfig } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
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
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
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
          return reject(new ApiError('Phiên đăng nhập hết hạn', 401));
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
      (Array.isArray(rawDetails) ? rawDetails[0] : 'Đã có lỗi xảy ra');
    throw new ApiError(message, response.status, resData);
  }

  return resData;
}
