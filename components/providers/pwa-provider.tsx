"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/registration";
import { initInstallPrompt } from "@/lib/pwa/install";

/**
 * Client-only PWA bootstrap: registers the service worker for offline support
 * and initializes the install prompt once per session.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    void registerServiceWorker();
    initInstallPrompt();
  }, []);

  return <>{children}</>;
}
