import { ApiResponse, AuthResponseData } from '@circle/types';
import { clearAuthStorage, getStoredTokens, saveTokens, saveUser } from './auth-storage';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string | null) => void)[] = [];

function onTokenRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (newToken: string | null) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Perform silent refresh of access and refresh tokens.
 */
async function silentRefreshToken(): Promise<string> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) {
    clearAuthStorage();
    throw new ApiError('No refresh token available', 401);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const body: ApiResponse<AuthResponseData> = await res.json();

    if (!res.ok || !body.success) {
      clearAuthStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('circle:unauthorized'));
      }
      throw new ApiError(body.message || 'Phiên làm việc hết hạn', res.status);
    }

    saveTokens(body.data.tokens);
    saveUser(body.data.user);

    return body.data.tokens.accessToken;
  } catch (err) {
    clearAuthStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('circle:unauthorized'));
    }
    throw err;
  }
}

/**
 * Universal API Request Wrapper with Auto Token Refresh
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth = false, retryCount = 0, headers = {}, ...fetchOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const { accessToken } = getStoredTokens();
    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  if (typeof window !== 'undefined') {
    const locale = localStorage.getItem('circle_locale') || 'vi';
    requestHeaders['x-circle-locale'] = locale;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });
  } catch (err: any) {
    throw new ApiError(err?.message || 'Không thể kết nối đến máy chủ', 503);
  }

  // Handle 401 Unauthorized with Silent Refresh
  if (response.status === 401 && !skipAuth && retryCount === 0) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newAccessToken = await silentRefreshToken();
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        // Retry original request with new token
        return apiRequest<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
        });
      } catch (refreshErr) {
        isRefreshing = false;
        onTokenRefreshed(null);
        throw refreshErr;
      }
    }

    // Wait for in-flight refresh to finish
    return new Promise((resolve, reject) => {
      addRefreshSubscriber((newToken) => {
        if (!newToken) {
          return reject(new ApiError('Phiên đăng nhập hết hạn', 401));
        }

        resolve(
          apiRequest<T>(endpoint, {
            ...options,
            retryCount: retryCount + 1,
          }),
        );
      });
    });
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as ApiResponse<T>;
}
