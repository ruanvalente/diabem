"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/use-auth";
import type { ConnectedDevice } from "@/lib/devices";
import type { DeviceCapabilities } from "@/lib/browser/capabilities";
import { useDevices } from "../hooks/use-devices";
import { CapabilitySummary } from "../ui/capability-summary.ui";
import { DeviceCard } from "../ui/device-card.ui";
import { DeviceEmptyState } from "../ui/device-empty-state.ui";
import { SyncHistory } from "../ui/sync-history.ui";
import { AddDeviceDialog } from "./add-device-dialog.widget";
import { SyncPreviewDialog } from "./sync-preview-dialog.widget";
import { ImportDataDialog } from "../../data-ownership/widget/import-data-dialog.widget";
import { Plug, Plus, History, Loader2 } from "lucide-react";

export function DeviceIntegrationSection() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const {
    capabilities,
    anySupported,
    devices,
    history,
    state,
    refresh,
    removeDevice,
  } = useDevices(userId);

  const [addOpen, setAddOpen] = useState(false);
  const [syncDevice, setSyncDevice] = useState<ConnectedDevice | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const handleSync = (device: ConnectedDevice) => {
    setSyncDevice(device);
  };

  const handleRemove = async (device: ConnectedDevice) => {
    if (!window.confirm(`Remover ${device.name} da lista de dispositivos?`)) {
      return;
    }
    await removeDevice(device.id);
  };

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="size-4 text-primary" aria-hidden="true" />
          Dispositivos
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Importe seus dados diretamente de dispositivos compatíveis. Você
            mantém o controle antes de importar.
          </p>
        </div>

        <CapabilityRow
          capabilities={capabilities}
          anySupported={anySupported}
        />

        <div className="border-t border-border px-5 py-4">
          <p className="text-sm font-medium text-foreground">Meus dispositivos</p>

          {state === "loading" ? (
            <div
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Carregando dispositivos...
            </div>
          ) : null}

          {!anySupported && state === "ready" ? (
            <div className="mt-3">
              <DeviceEmptyState onImportData={() => setImportOpen(true)} />
            </div>
          ) : null}

          {anySupported && state === "ready" ? (
            <div className="mt-3 space-y-2">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onSync={handleSync}
                    onRemove={handleRemove}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum dispositivo adicionado ainda. Adicione um para começar a
                  sincronizar.
                </p>
              )}

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Plus className="size-4" aria-hidden="true" />
                Adicionar dispositivo
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <History
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="text-sm font-medium text-foreground">
              Histórico de sincronização
            </h3>
          </div>
          <SyncHistory entries={history} />
        </div>
      </CardContent>

      <AddDeviceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        userId={userId}
        onAdded={refresh}
      />

      <SyncPreviewDialog
        open={!!syncDevice}
        onOpenChange={(o) => {
          if (!o) setSyncDevice(null);
        }}
        userId={userId}
        device={syncDevice}
        onSynced={refresh}
      />

      <ImportDataDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        userId={userId}
        onImported={refresh}
      />
    </Card>
  );
}

function CapabilityRow({
  capabilities,
  anySupported,
}: {
  capabilities: DeviceCapabilities;
  anySupported: boolean;
}) {
  return (
    <div className="border-t border-border px-5 py-4">
      <p className="text-sm font-medium text-foreground">
        Recursos do dispositivo
      </p>
      <div className="mt-2">
        <CapabilitySummary capabilities={capabilities} />
      </div>
      {!anySupported && (
        <p className="mt-2 text-sm text-muted-foreground">
          {capabilities.fileSystem.supported
            ? "Importe seus dados por arquivo (CSV ou JSON)."
            : "Nenhuma conexão de dispositivo é suportada neste navegador."}
        </p>
      )}
    </div>
  );
}
