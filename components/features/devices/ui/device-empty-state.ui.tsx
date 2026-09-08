import { Upload, Plug } from "lucide-react";

type DeviceEmptyStateProps = {
  onImportData: () => void;
};

/**
 * Shown when the browser does not offer any supported device connection API.
 * Presents a friendly message and directs the user to file import instead.
 */
export function DeviceEmptyState({ onImportData }: DeviceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
        <Plug className="size-6 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Seu navegador não oferece suporte a conexões com dispositivos.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Você ainda pode importar seus dados por CSV ou JSON.
        </p>
      </div>
      <button
        type="button"
        onClick={onImportData}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Upload className="size-4" aria-hidden="true" />
        Importar dados
      </button>
    </div>
  );
}
