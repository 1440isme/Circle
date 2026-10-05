'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthResponseData, AuthUserData } from '@circle/types';
import {
  ForgotPasswordInput,
  ResendOtpInput,
  ResetPasswordInput,
  UpdateProfileInput,
  VerifyOtpInput,
} from '@circle/shared';
import {
  forgotPasswordApi,
  getCurrentUserApi,
  getUserSessionsApi,
  loginApi,
  LoginPayload,
  registerApi,
  RegisterPayload,
  resendOtpApi,
  resetPasswordApi,
  ResetPasswordPayload,
  revokeOtherSessionsApi,
  revokeSessionApi,
  updateProfileApi,
  verifyOtpApi,
} from '../lib/auth';
import { useAuthStore } from '../stores/auth.store';

export const AUTH_KEYS = {
  me: ['auth', 'me'] as const,
  sessions: ['auth', 'sessions'] as const,
};

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (data: AuthResponseData) => {
      if (data.tokens) {
        setAuth(data.user, data.tokens);
        queryClient.setQueryData(AUTH_KEYS.me, data.user);
      }
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (data: AuthResponseData) => {
      if (data.tokens) {
        setAuth(data.user, data.tokens);
        queryClient.setQueryData(AUTH_KEYS.me, data.user);
      }
    },
  });
}

export function useVerifyOtpMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: VerifyOtpInput) => verifyOtpApi(payload),
    onSuccess: (data: AuthResponseData) => {
      if (data.tokens) {
        setAuth(data.user, data.tokens);
        queryClient.setQueryData(AUTH_KEYS.me, data.user);
      }
    },
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: (payload: ResendOtpInput) => resendOtpApi(payload),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordInput) => forgotPasswordApi(payload),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload | ResetPasswordInput) =>
      resetPasswordApi(payload),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfileInput) => updateProfileApi(payload),
    onSuccess: (data: AuthUserData) => {
      setUser(data);
      queryClient.setQueryData(AUTH_KEYS.me, data);
    },
  });
}

export function useCurrentUserQuery() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: getCurrentUserApi,
    enabled: isAuthenticated,
    select: (data: AuthUserData) => {
      setUser(data);
      return data;
    },
  });
}

export function useSessionsQuery() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: AUTH_KEYS.sessions,
    queryFn: getUserSessionsApi,
    enabled: isAuthenticated,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => revokeSessionApi(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.sessions });
    },
  });
}

export function useRevokeOtherSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeOtherSessionsApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.sessions });
    },
  });
}

