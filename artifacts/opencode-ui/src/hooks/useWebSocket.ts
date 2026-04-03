// ============================================================
// OpenCode Evolution - useWebSocket Hook
// Hook para conexión WebSocket con reconexión automática
// ============================================================

import { createSignal, onMount, onCleanup } from 'solid-js';

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface UseWebSocketReturn {
  send: (data: any) => void;
  onMessage: (callback: (data: any) => void) => void;
  onConnect: (callback: () => void) => void;
  onDisconnect: (callback: () => void) => void;
  onError: (callback: (error: Error) => void) => void;
  close: () => void;
  state: () => WebSocketState;
}

export function createWebSocket(url: string): UseWebSocketReturn {
  let ws: WebSocket | null = null;
  let reconnectTimeout: number | null = null;
  let messageListeners: Array<(data: any) => void> = [];
  let connectListeners: Array<() => void> = [];
  let disconnectListeners: Array<() => void> = [];
  let errorListeners: Array<(error: Error) => void> = [];

  const [state, setState] = createSignal<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null
  });

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        setState({
          isConnected: true,
          isConnecting: false,
          error: null
        });
        connectListeners.forEach(cb => cb());
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messageListeners.forEach(cb => cb(data));
        } catch {
          messageListeners.forEach(cb => cb(event.data));
        }
      };

      ws.onclose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));
        disconnectListeners.forEach(cb => cb());

        // Reconexión automática después de 3 segundos
        reconnectTimeout = window.setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        const err = new Error('WebSocket error');
        setState(prev => ({
          ...prev,
          error: err.message
        }));
        errorListeners.forEach(cb => cb(err));
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  };

  const send = (data: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  };

  const close = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }
  };

  // Auto-conectar
  if (typeof window !== 'undefined') {
    connect();
  }

  // Reconectar cuando la página vuelve a estar visible
  const handleVisibilityChange = () => {
    if (!document.hidden && !state().isConnected && !state().isConnecting) {
      connect();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  onCleanup(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    close();
  });

  return {
    send,
    onMessage: (callback) => messageListeners.push(callback),
    onConnect: (callback) => connectListeners.push(callback),
    onDisconnect: (callback) => disconnectListeners.push(callback),
    onError: (callback) => errorListeners.push(callback),
    close,
    state
  };
}

export default createWebSocket;
