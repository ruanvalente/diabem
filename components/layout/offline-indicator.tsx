"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/lib/offline/network-status";

export function OfflineIndicator() {
  const { isOffline } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(isOffline);

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      setShowRestored(true);
      const timer = window.setTimeout(() => setShowRestored(false), 3000);
      return () => window.clearTimeout(timer);
    }
    wasOffline.current = isOffline;
  }, [isOffline]);

  if (!isOffline && !showRestored) {
    return null;
  }

  if (showRestored && !isOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success shadow-lg"
      >
        <Wifi className="size-4" aria-hidden="true" />
        Conexão restaurada
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-medium text-foreground shadow-lg"
    >
      <WifiOff className="size-4 text-warning" aria-hidden="true" />
      Você está offline. Seus dados continuam disponíveis.
    </div>
  );
}
