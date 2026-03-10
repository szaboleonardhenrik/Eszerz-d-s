"use client";

import { useEffect, useRef, useCallback } from "react";

type SocketLike = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  disconnect: () => void;
  connected: boolean;
};

interface UseSocketOptions {
  onNotification?: (notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) => void;
  onUnreadCount?: (data: { count: number }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<SocketLike | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (socketRef.current?.connected) return;

    try {
      const { io } = await import("socket.io-client");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:3001";
      const socket = io(`${baseUrl}/ws`, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socket.on("notification", (data) => {
        optionsRef.current.onNotification?.(data);
      });

      socket.on("unread-count", (data) => {
        optionsRef.current.onUnreadCount?.(data);
      });

      socketRef.current = socket;
    } catch {
      // socket.io-client not available, fall back to polling
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
