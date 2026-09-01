"use client";

import { Lock } from "lucide-react";

export function LocalDataIndicator() {
  return (
    <div
      className="mx-auto flex items-center gap-1.5 px-5 py-2 text-xs text-muted-foreground"
      title="Seus dados de saúde ficam salvos apenas neste dispositivo, protegidos por criptografia. Nada é enviado para servidores nem compartilhado."
    >
      <Lock className="size-3.5" aria-hidden="true" />
      <span>
        Dados armazenados neste dispositivo. Nada é enviado para servidores nem
        compartilhado.
      </span>
    </div>
  );
}
