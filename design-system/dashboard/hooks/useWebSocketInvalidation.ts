import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';

interface WebSocketMessage {
  type: string;
  payload?: unknown;
}

export function useWebSocketInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        socket = new WebSocket(SOCKET_URL);

        socket.onopen = () => {
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        socket.onmessage = (event) => {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Invalidate queries based on event type
          switch (message.type) {
            case 'agent:update':
              queryClient.invalidateQueries({ queryKey: ['agents'] });
              break;
            case 'agent:health':
              queryClient.invalidateQueries({ queryKey: ['agents', 'health'] });
              break;
            case 'ingestion:queue':
              queryClient.invalidateQueries({ queryKey: ['ingestion', 'queue'] });
              break;
            case 'ingestion:dlq':
              queryClient.invalidateQueries({ queryKey: ['ingestion', 'dlq'] });
              break;
            case 'drift:event':
              queryClient.invalidateQueries({ queryKey: ['drift', 'events'] });
              queryClient.invalidateQueries({ queryKey: ['drift', 'stats'] });
              break;
            case 'memory:cluster':
              queryClient.invalidateQueries({ queryKey: ['memory', 'clusters'] });
              break;
            case 'pipeline:update':
              queryClient.invalidateQueries({ queryKey: ['pipelines', 'runs'] });
              break;
            case 'settings:update':
              queryClient.invalidateQueries({ queryKey: ['settings', 'config'] });
              break;
          }
        };

        socket.onerror = () => {
          // Error handled by reconnection logic
        };

        socket.onclose = () => {
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [queryClient]);
}
