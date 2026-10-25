import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import {
  getUserSessionsApi,
  revokeSessionApi,
  revokeOtherSessionsApi,
  changePasswordApi,
  ChangePasswordPayload,
} from '../services/api';

export const SESSION_KEYS = {
  all: ['sessions'] as const,
};

export function useSessionsQuery() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: SESSION_KEYS.all,
    queryFn: getUserSessionsApi,
    enabled: isAuthenticated,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => revokeSessionApi(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
    },
  });
}

export function useRevokeOtherSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeOtherSessionsApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
    },
  });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePasswordApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
    },
  });
}
