'use client';

import { useState, useEffect } from 'react';
import { getSocket, queryCircleOnlineUsers } from '../lib/socket';

export function useCirclePresence(circleId: string | null) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!circleId) {
      setOnlineUserIds(new Set());
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    // Initial fetch of online users in this circle
    queryCircleOnlineUsers(circleId, (res) => {
      if (res && res.success && Array.isArray(res.onlineUserIds)) {
        setOnlineUserIds(new Set(res.onlineUserIds));
      }
    });

    // Listen for live presence status changes
    const handlePresenceChange = (payload: {
      userId: string;
      status: 'ONLINE' | 'OFFLINE';
      timestamp: string;
    }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (payload.status === 'ONLINE') {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    socket.on('presence:user-status', handlePresenceChange);

    return () => {
      socket.off('presence:user-status', handlePresenceChange);
    };
  }, [circleId]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUserIds.has(userId);
  };

  return {
    onlineUserIds,
    onlineCount: onlineUserIds.size,
    isUserOnline,
  };
}
