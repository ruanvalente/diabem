"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  initInstallPrompt,
  onInstallPromptChange,
  promptInstall,
} from "@/lib/pwa/install";

export function InstallPrompt() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    initInstallPrompt();
    const unsubscribe = onInstallPromptChange(setAvailable);
    return unsubscribe;
  }, []);

  if (!available || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border bg-card p-3 shadow-elevated lg:bottom-6">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Tenha o DiaBem sempre à mão
        </p>
        <p className="text-xs text-muted-foreground">
          Instale o aplicativo no seu dispositivo
        </p>
      </div>
      <Button size="sm" onClick={() => void promptInstall()}>
        <Download className="size-3.5" aria-hidden="true" />
        Instalar
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dispensar convite de instalação"
        onClick={() => setDismissed(true)}
      >
        ✕
      </Button>
    </div>
  );
}
