"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  deviceIntegrationService,
  toFriendlyMessage,
  type Device,
  type DeviceAdapter,
} from "@/lib/devices";
import { Loader2, Search, Radio, Plus } from "lucide-react";

type AddDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onAdded?: () => void;
};

type Stage = "select" | "discovering" | "discovered" | "error";

export function AddDeviceDialog({
  open,
  onOpenChange,
  userId,
  onAdded,
}: AddDeviceDialogProps) {
  const adapters = deviceIntegrationService.getSupportedAdapters();
  const [stage, setStage] = useState<Stage>("select");
  const [devices, setDevices] = useState<Device[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);

  const reset = () => {
    setStage("select");
    setDevices([]);
    setErrorMessage(null);
    setSelectedAdapter(null);
  };

  const handleDiscover = async (adapter: DeviceAdapter) => {
    setSelectedAdapter(adapter.id);
    setStage("discovering");
    setErrorMessage(null);
    try {
      const found = await deviceIntegrationService.discoverByAdapter(adapter.id);
      setDevices(found);
      setStage(found.length > 0 ? "discovered" : "error");
      if (found.length === 0) {
        setErrorMessage("Nenhum dispositivo encontrado. Verifique se ele está ligado e próximo.");
      }
    } catch (error) {
      setErrorMessage(toFriendlyMessage(error));
      setStage("error");
    }
  };

  const handleAdd = async (device: Device) => {
    try {
      await deviceIntegrationService.registerDevice(userId, device);
      toast.add({ title: "Dispositivo adicionado.", type: "success" });
      onAdded?.();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.add({
        title: toFriendlyMessage(error),
        type: "error",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar dispositivo</DialogTitle>
          <DialogDescription>
            Conecte um dispositivo compatível para importar seus dados
            diretamente. Você mantém o controle antes de importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {stage === "select" && (
            <>
              {adapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum tipo de conexão é suportado neste navegador.
                </p>
              ) : (
                adapters.map((adapter) => (
                  <button
                    key={adapter.id}
                    type="button"
                    onClick={() => handleDiscover(adapter)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Radio className="size-5 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {adapter.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Buscar dispositivo próximo
                      </p>
                    </div>
                  </button>
                ))
              )}
            </>
          )}

          {stage === "discovering" && (
            <div
              className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-foreground">Buscando dispositivo...</p>
            </div>
          )}

          {stage === "discovered" && (
            <ul className="space-y-2">
              {devices.map((device) => (
                <li
                  key={device.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {device.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.manufacturer
                        ? `${device.manufacturer} · `
                        : ""}
                      {device.transport === "bluetooth" ? "Bluetooth" : "USB / Serial"}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleAdd(device)}>
                    <Plus className="size-4" aria-hidden="true" />
                    Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {stage === "error" && (
            <div
              className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="alert"
            >
              <p className="text-sm text-foreground">{errorMessage}</p>
              {selectedAdapter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const adapter = adapters.find((a) => a.id === selectedAdapter);
                    if (adapter) void handleDiscover(adapter);
                  }}
                >
                  <Search className="size-4" aria-hidden="true" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
