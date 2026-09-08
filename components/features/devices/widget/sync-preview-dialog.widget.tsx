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
  type ConnectedDevice,
  type SyncPreview,
} from "@/lib/devices";
import { Loader2, RefreshCw, Upload, CheckCircle2, Layers } from "lucide-react";

type SyncPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  device: ConnectedDevice | null;
  onSynced?: () => void;
};

type Stage = "idle" | "syncing" | "preview" | "importing" | "success" | "error";

export function SyncPreviewDialog({
  open,
  onOpenChange,
  userId,
  device,
  onSynced,
}: SyncPreviewDialogProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = () => {
    setStage("idle");
    setPreview(null);
    setErrorMessage(null);
  };

  const handleSync = async () => {
    if (!device) return;
    setStage("syncing");
    setErrorMessage(null);
    try {
      const result = await deviceIntegrationService.syncDevice(userId, device);
      setPreview(result);
      setStage("preview");
    } catch (error) {
      setErrorMessage(toFriendlyMessage(error));
      setStage("error");
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setStage("importing");
    try {
      const result = await deviceIntegrationService.confirmImport(
        userId,
        preview
      );
      toast.add({
        title: "Sincronização concluída.",
        description: result.message,
        type: "success",
      });
      setStage("success");
      onSynced?.();
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 900);
    } catch (error) {
      setErrorMessage(toFriendlyMessage(error));
      setStage("error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && stage !== "importing" && stage !== "syncing") {
          reset();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronizar {device?.name ?? "dispositivo"}</DialogTitle>
          <DialogDescription>
            Os dados serão lidos do dispositivo e apresentados para sua
            confirmação antes de serem importados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {stage === "idle" && (
            <p className="text-sm text-muted-foreground">
              Conecte-se ao dispositivo para ler os registros.
            </p>
          )}

          {stage === "syncing" || stage === "importing" ? (
            <div
              className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-foreground">
                {stage === "syncing"
                  ? "Lendo dispositivo..."
                  : "Importando registros..."}
              </p>
            </div>
          ) : null}

          {stage === "preview" && preview ? (
            <div className="space-y-4" aria-live="polite">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Sincronização concluída
                </p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Registros encontrados
                    </dt>
                    <dd className="font-medium text-foreground">
                      {preview.result.totalRecords}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Novos</dt>
                    <dd className="font-medium text-foreground">
                      {preview.result.newRecords}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Já existentes</dt>
                    <dd>{preview.result.duplicateCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Erros</dt>
                    <dd>{preview.result.errorCount}</dd>
                  </div>
                </dl>
              </div>

              {preview.result.newRecords > 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <Layers className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-muted-foreground">
                    {preview.result.newRecords} registro(s) estarão disponíveis
                    no seu dashboard após a importação.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todos os registros já estão no seu dispositivo. Nada novo para importar.
                </p>
              )}
            </div>
          ) : null}

          {stage === "success" ? (
            <div
              className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="size-8 text-green-600" />
              <p className="text-sm font-medium text-foreground">
                Sincronização concluída.
              </p>
            </div>
          ) : null}

          {stage === "error" ? (
            <div
              className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="alert"
            >
              <p className="text-sm text-foreground">{errorMessage}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={stage === "syncing" || stage === "importing"}
          >
            Fechar
          </Button>

          {stage === "idle" || stage === "error" ? (
            <Button onClick={handleSync}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Sincronizar agora
            </Button>
          ) : null}

          {stage === "preview" && preview && preview.result.newRecords > 0 ? (
            <Button onClick={handleImport}>
              <Upload className="size-4" aria-hidden="true" />
              Importar {preview.result.newRecords} registro(s)
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
