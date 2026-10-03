import { io, Socket } from 'socket.io-client';
import { getStoredTokens } from './auth-storage';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Initializes or returns the existing Socket.IO singleton instance.
 */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const { accessToken } = getStoredTokens();
  if (!accessToken) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket) {
    // If socket exists but disconnected or token changed, update auth
    if (!socket.connected) {
      socket.auth = { token: accessToken };
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // Socket connected
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket.IO] Connection error:', error.message);
  });

  return socket;
}

/**
 * Cleanly disconnects the current socket instance (e.g. on logout).
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a specific channel room for realtime group chat events.
 */
export function joinChannelRoom(channelId: string): void {
  const s = getSocket();
  if (s && channelId) {
    s.emit('chat:join-channel', { channelId });
  }
}

/**
 * Leave a specific channel room.
 */
export function leaveChannelRoom(channelId: string): void {
  const s = getSocket();
  if (s && channelId) {
    s.emit('chat:leave-channel', { channelId });
  }
}

/**
 * Broadcast typing status to current channel members.
 */
export function sendTypingStatus(channelId: string, isTyping: boolean): void {
  const s = getSocket();
  if (s && channelId) {
    s.emit('chat:typing', { channelId, isTyping });
  }
}

/**
 * Request list of currently online user IDs in a circle.
 */
export function queryCircleOnlineUsers(
  circleId: string,
  callback: (response: { success: boolean; circleId: string; onlineUserIds: string[] }) => void,
): void {
  const s = getSocket();
  if (s && circleId) {
    s.emit('presence:get-circle-online', { circleId }, callback);
  }
}

