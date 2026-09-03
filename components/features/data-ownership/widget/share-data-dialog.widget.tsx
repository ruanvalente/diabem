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
import { dataOwnershipService } from "@/lib/data-ownership";
import type { ExportFormat, ExportScope } from "@/lib/data-ownership";
import { SHARE_CONFIRMATION_MESSAGE } from "@/lib/data-ownership";
import { Loader2, Share2 } from "lucide-react";

const DATA_TYPES: { key: keyof ExportScope; label: string }[] = [
  { key: "glucose", label: "Glicemia" },
  { key: "meals", label: "Alimentação" },
  { key: "activities", label: "Atividade" },
  { key: "notes", label: "Observações" },
];

type ShareDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  canShareFile: boolean;
};

export function ShareDataDialog({
  open,
  onOpenChange,
  userId,
  canShareFile,
}: ShareDataDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [scope, setScope] = useState<ExportScope>(() => dataOwnershipService.defaultScope);
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const anySelected =
    scope.glucose || scope.meals || scope.activities || scope.notes;

  function toggleScope(key: keyof ExportScope) {
    setScope((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const handleShare = async () => {
    if (!anySelected) {
      toast.add({ title: "Selecione ao menos um tipo de dado.", type: "error" });
      return;
    }

    setIsPending(true);
    try {
      const files = await dataOwnershipService.getExportableFiles(userId, {
        format,
        scope,
      });

      for (const file of files) {
        const result = await dataOwnershipService.shareFiles([file]);
        if (!result.ok && !result.cancelled) {
          toast.add({ title: "Não foi possível compartilhar.", type: "error" });
          return;
        }
        if (result.ok && result.method === "download") {
          toast.add({ title: "Arquivo baixado.", type: "success" });
        }
      }
      onOpenChange(false);
    } catch {
      toast.add({ title: "Não foi possível compartilhar.", type: "error" });
    } finally {
      setIsPending(false);
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar dados</DialogTitle>
          <DialogDescription>
            Ao compartilhar, você envia uma cópia dos seus dados para outro aplicativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {confirming ? (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm dark:bg-amber-950/40">
              <p className="text-amber-800 dark:text-amber-200">
                {SHARE_CONFIRMATION_MESSAGE}
              </p>
            </div>
          ) : (
            <>
              <div>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    Formato
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["json", "csv"] as ExportFormat[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={format === value}
                        onClick={() => setFormat(value)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                          format === value
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {value.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    Dados
                  </legend>
                  <div className="space-y-2">
                    {DATA_TYPES.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={scope[item.key]}
                          onChange={() => toggleScope(item.key)}
                          className="size-4 accent-primary"
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirming(false);
              onOpenChange(false);
            }}
            disabled={isPending}
          >
            Cancelar
          </Button>
          {confirming ? (
            <Button onClick={handleShare} disabled={isPending || !anySelected}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <Share2 className="size-4" aria-hidden="true" />
              Continuar e compartilhar
            </Button>
          ) : (
            <Button onClick={() => setConfirming(true)} disabled={!anySelected}>
              <Share2 className="size-4" aria-hidden="true" />
              {canShareFile ? "Compartilhar" : "Baixar arquivo"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
