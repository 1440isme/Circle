import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  CallType,
  CallSessionDetailEntity,
  InitiateCallResponse,
  IceServersResponse,
  CallParticipantEntity,
} from '@circle/types';

export const CALL_KEYS = {
  all: ['calls'] as const,
  active: (circleId: string | null) => [...CALL_KEYS.all, 'active', circleId] as const,
  history: (circleId: string | null) => [...CALL_KEYS.all, 'history', circleId] as const,
  iceServers: () => [...CALL_KEYS.all, 'iceServers'] as const,
};

/**
 * Fetch ICE server configurations (STUN & TURN).
 */
export function useIceServersQuery() {
  return useQuery({
    queryKey: CALL_KEYS.iceServers(),
    queryFn: async () => {
      const res = await apiRequest<IceServersResponse>('/calls/ice-servers');
      const data: any = (res as any)?.data || res;
      return data?.iceServers || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

/**
 * Queries the active call session in the circle and syncs with realtime socket events.
 */
export function useActiveCallQuery(circleId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CALL_KEYS.active(circleId),
    queryFn: async () => {
      if (!circleId) return null;
      try {
        const res = await apiRequest<CallSessionDetailEntity>(
          `/circles/${circleId}/calls/active`,
        );
        const data: any = (res as any)?.data || res;
        return data || null;
      } catch {
        return null;
      }
    },
    enabled: !!circleId,
    staleTime: 1000 * 5,
  });

  // Realtime synchronization via Socket.IO
  useEffect(() => {
    if (!circleId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleIncoming = (payload: any) => {
      if (payload.circleId === circleId) {
        queryClient.invalidateQueries({ queryKey: CALL_KEYS.active(circleId) });
      }
    };

    const handleEnded = (payload: any) => {
      if (!payload || !payload.circleId || payload.circleId === circleId || (query.data && query.data.id === payload.callSessionId)) {
        queryClient.setQueryData(CALL_KEYS.active(circleId), null);
        queryClient.invalidateQueries({ queryKey: CALL_KEYS.active(circleId) });
      }
    };

    const handleParticipantChange = () => {
      queryClient.invalidateQueries({ queryKey: CALL_KEYS.active(circleId) });
    };

    const handleChatMessage = (msg: any) => {
      if (msg?.content?.startsWith('[CALL_SUMMARY]:')) {
        queryClient.setQueryData(CALL_KEYS.active(circleId), null);
        queryClient.invalidateQueries({ queryKey: CALL_KEYS.active(circleId) });
      }
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:ended', handleEnded);
    socket.on('call:participant-joined', handleParticipantChange);
    socket.on('call:participant-left', handleParticipantChange);
    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:ended', handleEnded);
      socket.off('call:participant-joined', handleParticipantChange);
      socket.off('call:participant-left', handleParticipantChange);
      socket.off('chat:message', handleChatMessage);
    };
  }, [circleId, queryClient, query.data]);

  return query;
}

/**
 * Initiates a new call session or joins existing active call in circle.
 */
export function useInitiateCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      circleId,
      callType,
    }: {
      circleId: string;
      callType: CallType;
    }) => {
      const res = await apiRequest<InitiateCallResponse>(
        `/circles/${circleId}/calls`,
        {
          method: 'POST',
          body: JSON.stringify({ callType }),
        },
      );
      return (res as any)?.data || res;
    },
    onSuccess: (data: any, variables) => {
      const session = data?.callSession || data;
      if (session) {
        queryClient.setQueryData(
          CALL_KEYS.active(variables.circleId),
          session,
        );
      }
    },
  });
}

/**
 * Joins an ongoing active call.
 */
export function useJoinCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callSessionId }: { callSessionId: string }) => {
      const res = await apiRequest<CallParticipantEntity>(
        `/calls/${callSessionId}/join`,
        {
          method: 'POST',
        },
      );
      return (res as any)?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALL_KEYS.all });
    },
  });
}

/**
 * Leaves an ongoing call session.
 */
export function useLeaveCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callSessionId }: { callSessionId: string }) => {
      const res = await apiRequest<{ success: boolean; isCallEnded: boolean }>(
        `/calls/${callSessionId}/leave`,
        {
          method: 'POST',
        },
      );
      return (res as any)?.data || res;
    },
    onSuccess: (data: any) => {
      if (data?.isCallEnded) {
        queryClient.setQueriesData({ queryKey: [...CALL_KEYS.all, 'active'] }, null);
      }
      queryClient.invalidateQueries({ queryKey: CALL_KEYS.all });
    },
  });
}

/**
 * Ends an ongoing call session completely.
 */
export function useEndCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callSessionId }: { callSessionId: string }) => {
      const res = await apiRequest<{ success: boolean; endedAt: string }>(
        `/calls/${callSessionId}/end`,
        {
          method: 'POST',
        },
      );
      return (res as any)?.data || res;
    },
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: [...CALL_KEYS.all, 'active'] }, null);
      queryClient.invalidateQueries({ queryKey: CALL_KEYS.all });
    },
  });
}
