# Example: useChatSocket Custom Hook

Reference implementation of a realtime Socket.IO listener hook in React (`web/src/hooks/useChatSocket.ts`).

---

```tsx
'use client';

import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

export function useChatSocket(channelId: string) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !channelId) return;

    socket.emit('channel:join', { channelId });

    const handleNewMessage = (message: any) => {
      queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData) return [message];
        return [...oldData, message];
      });
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.emit('channel:leave', { channelId });
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket, channelId, queryClient]);
}
```
