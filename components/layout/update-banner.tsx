"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyUpdate, checkForUpdates } from "@/lib/pwa/update.service";

export function UpdateBanner() {
  const [updateReady, setUpdateReady] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;
    void checkForUpdates().then((state) => {
      if (mounted && state.status === "update-available") {
        setUpdateReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpdate() {
    setUpdating(true);
    await applyUpdate();
    setUpdating(false);
  }

  if (!updateReady) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border bg-card p-3 shadow-elevated lg:bottom-6"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Uma nova versão do DiaBem está disponível
        </p>
      </div>
      <Button size="sm" onClick={handleUpdate} disabled={updating}>
        <RefreshCcw
          className={`size-3.5 ${updating ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        Atualizar
      </Button>
    </div>
  );
}
