"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tracks the browser-reported network connectivity.
 *
 * Uses `navigator.onLine` plus the `online`/`offline` window events. The value
 * reflects what the browser reports and is NOT an absolute guarantee of reach
 * to a host; it is the signal used to drive the offline banner UX.
 */

export function getInitialOnlineState(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function useNetworkStatus(): {
  isOnline: boolean;
  isOffline: boolean;
} {
  const [isOnline, setIsOnline] = useState<boolean>(getInitialOnlineState);

  const handleOnline = useCallback(() => setIsOnline(true), []);
  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, isOffline: !isOnline };
}
