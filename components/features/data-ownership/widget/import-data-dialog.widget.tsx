"use client";

import { useRef, useState } from "react";
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
import { dataOwnershipService } from "@/lib/data-ownership";
import type {
  ImportPreview,
  ImportState,
  NormalizedImportData,
} from "@/lib/data-ownership";
import { Loader2, Upload, FileUp, CheckCircle2 } from "lucide-react";

type ImportDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onImported?: () => void;
};

export function ImportDataDialog({
  open,
  onOpenChange,
  userId,
  onImported,
}: ImportDataDialogProps) {
  const [state, setState] = useState<ImportState>("idle");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [normalizedData, setNormalizedData] =
    useState<NormalizedImportData | null>(null);
  const [isPending, setIsPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState("idle");
    setPreview(null);
    setNormalizedData(null);
    setIsPending(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      if (state === "importing") return;
      reset();
    }
    onOpenChange(openState);
  };

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;

    setState("reading");
    setIsPending(true);

    try {
      const prepared = await dataOwnershipService.prepareImport(file);

      if (prepared.fileKind === "unknown") {
        toast.add({
          title: "Formato de arquivo não reconhecido.",
          type: "error",
        });
        setState("error");
        return;
      }

      const totalRecords =
        prepared.normalizedData.glucose.length +
        prepared.normalizedData.meals.length +
        prepared.normalizedData.activities.length +
        prepared.normalizedData.notes.length;

      if (totalRecords === 0) {
        const firstError = prepared.validationErrors[0]?.message;
        toast.add({
          title: firstError ?? "Nenhum registro válido encontrado no arquivo.",
          type: "error",
        });
        setState("error");
        return;
      }

      setNormalizedData(prepared.normalizedData);

      const previewData = await dataOwnershipService.buildPreview(
        userId,
        prepared.fileName,
        prepared.fileKind,
        prepared.normalizedData,
      );
      setPreview(previewData);
      setState("preview");
    } catch (err) {
      toast.add({
        title:
          err instanceof Error
            ? err.message
            : "Não foi possível ler este arquivo.",
        type: "error",
      });
      setState("error");
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!normalizedData) return;

    setState("importing");
    setIsPending(true);
    try {
      const result = await dataOwnershipService.importUserData(
        userId,
        normalizedData,
      );
      toast.add({
        title: "Importação concluída.",
        description: `${result.totalImported} registros adicionados.${result.duplicatesSkipped > 0 ? ` ${result.duplicatesSkipped} duplicados ignorados.` : ""}`,
        type: "success",
      });
      setState("success");
      onImported?.();
      setTimeout(() => handleClose(false), 900);
    } catch {
      toast.add({
        title: "Não foi possível importar este arquivo.",
        type: "error",
      });
      setState("error");
    } finally {
      setIsPending(false);
    }
  };

  const totalCount =
    state === "preview" && preview
      ? preview.glucoseCount +
        preview.mealsCount +
        preview.activitiesCount +
        preview.notesCount
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar dados</DialogTitle>
          <DialogDescription>
            Seus dados ficam armazenados neste dispositivo. Selecione um arquivo
            JSON ou CSV exportado do DiaBem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {state === "idle" || state === "error" ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <FileUp className="size-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Arraste um arquivo aqui
                </p>
                <p className="mt-1 text-sm text-muted-foreground">ou</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  Selecionar arquivo
                </p>
              </div>
            </button>
          ) : null}

          {state === "reading" || (state === "validating" && isPending) ? (
            <div
              className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-foreground">Validando arquivo...</p>
            </div>
          ) : null}

          {state === "preview" && preview ? (
            <div className="space-y-4" aria-live="polite">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Preview da importação
                </p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Arquivo</dt>
                    <dd className="font-medium text-foreground">
                      {preview.fileName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tipo</dt>
                    <dd className="font-medium text-foreground uppercase">
                      {preview.fileKind}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Glicemias</dt>
                    <dd>{preview.glucoseCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Refeições</dt>
                    <dd>{preview.mealsCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Atividades</dt>
                    <dd>{preview.activitiesCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Observações</dt>
                    <dd>{preview.notesCount}</dd>
                  </div>
                  <div className="my-2 h-px bg-border" />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Total de registros
                    </dt>
                    <dd className="font-medium text-foreground">
                      {totalCount}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Duplicados</dt>
                    <dd>{preview.duplicateCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Erros</dt>
                    <dd>{preview.errorCount}</dd>
                  </div>
                </dl>
              </div>

              {preview.errorCount > 0 && (
                <p className="text-sm text-destructive" role="alert">
                  {preview.errorCount} registro(s) não poderão ser importados.
                </p>
              )}
            </div>
          ) : null}

          {state === "importing" ? (
            <div
              className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-foreground">Importando...</p>
            </div>
          ) : null}

          {state === "success" ? (
            <div
              className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="size-8 text-green-600" />
              <p className="text-sm font-medium text-foreground">
                Importação concluída.
              </p>
            </div>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={state === "importing"}
          >
            Cancelar
          </Button>
          {state === "preview" && (
            <Button onClick={handleConfirmImport}>
              <Upload className="size-4" aria-hidden="true" />
              Importar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
