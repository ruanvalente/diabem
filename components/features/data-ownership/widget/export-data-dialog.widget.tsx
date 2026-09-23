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
import type { ExportFormat } from "@/lib/data-ownership";
import { BACKUP_WARNING } from "@/lib/data-ownership";
import { useExportSelection } from "../hooks/use-export-selection";
import { DataScopeCheckboxes } from "../ui/data-scope-checkboxes.ui";
import { Loader2, Download, Info } from "lucide-react";

const FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  {
    value: "json",
    label: "JSON",
    description: "Recomendado para backup e migração",
  },
  {
    value: "csv",
    label: "CSV",
    description: "Ideal para análise em planilhas",
  },
];

type ExportDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

export function ExportDataDialog({
  open,
  onOpenChange,
  userId,
}: ExportDataDialogProps) {
  const { format, setFormat, scope, toggleScope, anySelected } =
    useExportSelection();
  const [showWarning, setShowWarning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!anySelected) {
      toast.add({
        title: "Selecione ao menos um tipo de dado.",
        type: "error",
      });
      return;
    }

    setIsExporting(true);
    try {
      await dataOwnershipService.exportUserData(userId, {
        format,
        scope,
      });
      toast.add({ title: "Seus dados foram exportados.", type: "success" });
      setShowWarning(false);
      onOpenChange(false);
    } catch {
      toast.add({
        title: "Não foi possível exportar seus dados.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar seus dados</DialogTitle>
          <DialogDescription>
            Seus dados são exportados direto deste dispositivo. Nenhum dado é
            enviado para servidores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {showWarning ? (
            <div className="space-y-4 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm dark:bg-amber-950/40">
              <p className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{BACKUP_WARNING.message}</span>
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowWarning(false)}
                  disabled={isExporting}
                >
                  Voltar
                </Button>
                <Button onClick={handleExport} disabled={isExporting}>
                  {isExporting && <Loader2 className="size-4 animate-spin" />}
                  Continuar e exportar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    Formato
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={format === option.value}
                        onClick={() => setFormat(option.value)}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                          format === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <span className="font-medium text-foreground">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div>
                <DataScopeCheckboxes scope={scope} onToggle={toggleScope} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          {!showWarning && (
            <Button
              onClick={() => setShowWarning(true)}
              disabled={!anySelected}
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
