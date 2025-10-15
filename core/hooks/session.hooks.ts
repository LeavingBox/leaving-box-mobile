import { useEffect, useState } from "react";
import { Socket } from "@/core/api/session.api";

// hooks/session.hooks.ts/useSocketEvent
export function useSocketEvent<T = any>(
  event: string,
  callback: (data: T) => void
) {
  useEffect(() => {
    if (!Socket.connected) {
      Socket.connect();
    }
    const handler = (data: T) => {
      callback(data);
    };

    // Remove any existing listener for this event with the same callback
    Socket.off(event, handler);
    Socket.on(event, handler);

    return () => {
      Socket.off(event, handler);
    };
  }, [event, callback]);
}

// hooks/session.hooks.ts/useSocketEmit
export function useSocketEmit() {
  function emit<T = any>(
    event: string,
    data?: any,
    callback?: (response: T) => void
  ) {
    if (!Socket.connected) {
      Socket.connect();
    }

    Socket.emit(event, data, callback);
  }

  return emit;
}

// hooks/session.hooks.ts/useSocketLifecycle
export function useSocketLifecycle() {
  const [isConnected, setIsConnected] = useState(Socket.connected);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    };

    const handleError = (err: Error) => {
      setError(err);
    };

    Socket.on("connect", handleConnect);
    Socket.on("disconnect", handleDisconnect);
    Socket.on("connect_error", handleError);
    Socket.on("error", handleError);

    return () => {
      Socket.off("connect", handleConnect);
      Socket.off("disconnect", handleDisconnect);
      Socket.off("connect_error", handleError);
      Socket.off("error", handleError);
    };
  }, []);

  return { isConnected, error };
}

// hooks/session.hooks.ts/useSocketQuery
interface UseSocketQueryOptions {
  refetchInterval?: number; // in milliseconds
}

export function useSocketQuery<T = any>(
  event: string,
  requestData?: any,
  options?: UseSocketQueryOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handler = (response: T) => {
      setData(response);
      setIsLoading(false);
    };

    // Listen for the response event
    Socket.on(event, handler);

    // If requestData is provided, emit the event to fetch data
    if (requestData) {
      Socket.emit(event, requestData);
    }

    let interval: NodeJS.Timeout | null = null;
    if (options?.refetchInterval) {
      interval = setInterval(() => {
        Socket.emit(event, requestData);
      }, options.refetchInterval);
    }

    return () => {
      Socket.off(event, handler);
      if (interval) clearInterval(interval);
    };
  }, [event, requestData, options?.refetchInterval]);

  return { data, error, isLoading };
}