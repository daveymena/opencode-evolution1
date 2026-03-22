import { useState, useEffect, useRef, useCallback } from "react";

interface WsMessage {
  type: string;
  data: any;
}

export function useWebSocket(projectId?: number) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;

    // Use standard window.location to build WS URL relative to current host
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws?projectId=${projectId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WS] Connected to project", projectId);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (e) {
        console.error("[WS] Failed to parse message", e);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      setIsConnected(false);
      // Optional: implement reconnect logic here
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("[WS] Error", error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [projectId]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn("[WS] Cannot send message, socket not connected");
    }
  }, []);

  return { isConnected, messages, sendMessage };
}
