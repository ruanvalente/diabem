import { CheckCircle2, XCircle } from "lucide-react";
import type { SyncHistoryEntry } from "@/lib/devices";

type SyncHistoryProps = {
  entries: SyncHistoryEntry[];
};

/**
 * Renders the sync history list (most recent first). Each row shows the device
 * name, timestamp and the number of new records imported.
 */
export function SyncHistory({ entries }: SyncHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma sincronização registrada ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm"
        >
          {entry.ok ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-green-600"
              aria-hidden="true"
            />
          ) : (
            <XCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-foreground">{entry.deviceName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(entry.syncedAt)} · {entry.importedCount} novo(s){" "}
              {entry.duplicateCount > 0
                ? `· ${entry.duplicateCount} duplicado(s)`
                : ""}
              {entry.errorCount > 0 ? `· ${entry.errorCount} erro(s)` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return (
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " às " +
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}
