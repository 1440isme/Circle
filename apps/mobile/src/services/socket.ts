import { io, Socket } from 'socket.io-client';
import { getAuthTokens } from './storage';
import { getApiBaseUrl } from './api';

let socket: Socket | null = null;
let currentActiveChannelId: string | null = null;
const connectionListeners = new Set<(connected: boolean) => void>();

function notifyConnectionChange(connected: boolean) {
  connectionListeners.forEach((listener) => {
    try {
      listener(connected);
    } catch {
      // ignore errors in listeners
    }
  });
}

export function subscribeSocketConnection(listener: (connected: boolean) => void): () => void {
  connectionListeners.add(listener);
  if (socket) {
    listener(socket.connected);
  } else {
    listener(false);
  }
  return () => {
    connectionListeners.delete(listener);
  };
}

export function isMobileSocketConnected(): boolean {
  return !!socket?.connected;
}

export async function getMobileSocket(): Promise<Socket | null> {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) {
    if (socket) {
      socket.disconnect();
      socket = null;
      notifyConnectionChange(false);
    }
    return null;
  }

  if (socket) {
    if (!socket.connected) {
      socket.auth = { token: accessToken };
      socket.connect();
    }
    return socket;
  }

  const socketUrl = getApiBaseUrl().replace('/api/v1', '');

  socket = io(socketUrl, {
    auth: { token: accessToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    notifyConnectionChange(true);
    if (currentActiveChannelId) {
      socket?.emit('chat:join-channel', { channelId: currentActiveChannelId });
    }
  });

  socket.on('disconnect', () => {
    notifyConnectionChange(false);
  });

  socket.on('connect_error', (error) => {
    notifyConnectionChange(false);
    console.warn('[Mobile Socket.IO] Connection error:', error.message);
  });

  return socket;
}

export function disconnectMobileSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentActiveChannelId = null;
    notifyConnectionChange(false);
  }
}

export async function joinMobileChannelRoom(channelId: string): Promise<void> {
  currentActiveChannelId = channelId;
  const s = await getMobileSocket();
  if (s && channelId) {
    s.emit('chat:join-channel', { channelId });
  }
}

export async function leaveMobileChannelRoom(channelId: string): Promise<void> {
  if (currentActiveChannelId === channelId) {
    currentActiveChannelId = null;
  }
  const s = await getMobileSocket();
  if (s && channelId) {
    s.emit('chat:leave-channel', { channelId });
  }
}

export async function sendMobileTypingStatus(
  channelId: string,
  isTyping: boolean,
  userName?: string,
): Promise<void> {
  const s = await getMobileSocket();
  if (s && channelId) {
    s.emit('chat:typing', { channelId, isTyping, userName });
  }
}
