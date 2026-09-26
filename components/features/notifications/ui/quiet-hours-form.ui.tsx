import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NotificationQuietHours } from "@/lib/notifications/types";

type QuietHoursFormProps = {
  value: NotificationQuietHours;
  onChange: (value: NotificationQuietHours) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function QuietHoursForm({
  value,
  onChange,
  disabled = false,
  idPrefix = "quiet-hours",
}: QuietHoursFormProps) {
  const startId = `${idPrefix}-start`;
  const endId = `${idPrefix}-end`;

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-foreground">Período silencioso</legend>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 text-sm">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) =>
            onChange({ ...value, enabled: event.target.checked })
          }
          className="size-4 accent-primary"
        />
        <span className="font-medium text-foreground">Ativar período silencioso</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={startId}>Início</Label>
          <Input
            id={startId}
            type="time"
            value={value.start}
            disabled={!value.enabled}
            onChange={(event) => onChange({ ...value, start: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={endId}>Fim</Label>
          <Input
            id={endId}
            type="time"
            value={value.end}
            disabled={!value.enabled}
            onChange={(event) => onChange({ ...value, end: event.target.value })}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Nenhum lembrete é exibido dentro do período silencioso, inclusive quando ele
        atravessa a meia-noite.
      </p>
    </fieldset>
  );
}
