'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthResponseData, AuthUserData } from '@circle/types';
import { getCurrentUserApi, loginApi, LoginPayload, registerApi, RegisterPayload } from '../lib/auth';
import { useAuthStore } from '../stores/auth.store';

export const AUTH_KEYS = {
  me: ['auth', 'me'] as const,
};

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (data: AuthResponseData) => {
      setAuth(data.user, data.tokens);
      queryClient.setQueryData(AUTH_KEYS.me, data.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (data: AuthResponseData) => {
      setAuth(data.user, data.tokens);
      queryClient.setQueryData(AUTH_KEYS.me, data.user);
    },
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
