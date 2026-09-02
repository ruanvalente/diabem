"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/lib/offline/network-status";

/**
 * Online/offline status badge for the header. Color is never the only signal:
 * the icon and text change with connectivity and the meaning is announced via
 * the `status` role.
 */
export function ConnectionStatus() {
  const { isOffline } = useNetworkStatus();

  if (isOffline) {
    return (
      <Badge
        variant="outline"
        role="status"
        aria-live="polite"
        className="gap-1 border-warning/40 bg-warning/10 text-foreground"
      >
        <WifiOff className="size-3 text-warning" aria-hidden="true" />
        <span className="hidden sm:inline">Offline</span>
        <span className="sr-only">Você está offline</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      role="status"
      aria-live="polite"
      className="gap-1 border-success/30 bg-success/10 text-success"
    >
      <Wifi className="size-3" aria-hidden="true" />
      <span className="hidden sm:inline">Online</span>
      <span className="sr-only">Você está online</span>
    </Badge>
  );
}
