import { AuthResponseData, AuthUserData } from '@circle/types';
import {
  ForgotPasswordInput,
  RegisterInput,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from '@circle/shared';
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
 * Register a new user account (unactivated, sends OTP).
 */
export async function registerApi(payload: RegisterPayload): Promise<AuthResponseData> {
  const res = await apiRequest<AuthResponseData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  if (res.data?.tokens) {
    saveTokens(res.data.tokens);
  }
  if (res.data?.user) {
    saveUser(res.data.user);
  }

  return res.data;
}

/**
 * Verify 6-digit OTP to activate account.
 */
export async function verifyOtpApi(payload: VerifyOtpInput): Promise<AuthResponseData> {
  const res = await apiRequest<AuthResponseData>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  if (res.data?.tokens) {
    saveTokens(res.data.tokens);
  }
  if (res.data?.user) {
    saveUser(res.data.user);
  }

  return res.data;
}

/**
 * Resend OTP code with cooldown check.
 */
export async function resendOtpApi(payload: ResendOtpInput): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  return res.data;
}

/**
 * Request password recovery OTP.
 */
export async function forgotPasswordApi(
  payload: ForgotPasswordInput,
): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  return res.data;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Reset password with verified OTP.
 */
export async function resetPasswordApi(
  payload: ResetPasswordPayload | ResetPasswordInput,
): Promise<{ message: string }> {
  const { email, otp, newPassword } = payload;
  const res = await apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
    skipAuth: true,
  });

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

