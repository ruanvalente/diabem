"use client";

import { useEffect, useRef, useState } from "react";
import { HardDrive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStorageEstimate,
  isNearStorageLimit,
  requestPersistentStorage,
} from "@/lib/offline/storage.service";

/**
 * Storage persistence + quota awareness.
 *
 * - Best-effort request for durable storage (reduces the chance the browser
 *   evicts local data under storage pressure). If the API is unavailable or the
 *   request is denied the app continues degraded, never blocked.
 * - Surfaces a dismissible warning when the device is close to its quota. The
 *   warning disappears automatically on the next check once usage settles.
 */
export function StorageWarning() {
  const [warning, setWarning] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    let disposed = false;

    const checkStorage = async () => {
      if (dismissed.current) return;
      // Fire-and-forget: persistence is a soft request, not a prerequisite.
      void requestPersistentStorage();
      const estimate = await getStorageEstimate();
      if (disposed || dismissed.current) return;
      if (isNearStorageLimit(estimate)) {
        setWarning(true);
      }
    };

    void checkStorage();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkStorage();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!warning) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-warning/40 bg-card p-3 shadow-elevated lg:bottom-6"
    >
      <HardDrive className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="flex-1 text-sm text-foreground">
        O armazenamento deste dispositivo está quase cheio. Considere exportar
        seus dados antes de continuar.
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dispensar aviso de armazenamento"
        onClick={() => {
          dismissed.current = true;
          setWarning(false);
        }}
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}