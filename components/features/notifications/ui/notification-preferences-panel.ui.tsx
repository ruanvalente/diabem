import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { NotificationQuietHours } from "@/lib/notifications/types";
import { QuietHoursForm } from "./quiet-hours-form.ui";

/**
 * Editable subset of the persisted preferences: the record also carries the
 * user, the timezone and the audit timestamps owned by the repository.
 */
export type NotificationPreferencesDraft = {
  enabled: boolean;
  quietHours: NotificationQuietHours;
};

type NotificationPreferencesPanelProps = {
  value: NotificationPreferencesDraft;
  onChange: (value: NotificationPreferencesDraft) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
};

/**
 * Renders the reminder master switch and the silent window. The draft and the
 * dirty state are owned by the widget, which also performs the save.
 */
export function NotificationPreferencesPanel({
  value,
  onChange,
  isDirty,
  isSaving,
  onSave,
}: NotificationPreferencesPanelProps) {
  return (
    <section aria-labelledby="notification-preferences-title" className="px-5 py-4">
      <h3
        id="notification-preferences-title"
        className="text-sm font-medium text-foreground"
      >
        Preferências
      </h3>

      <div className="mt-3 space-y-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={value.enabled}
            disabled={isSaving}
            onChange={(event) =>
              onChange({ ...value, enabled: event.target.checked })
            }
            className="size-4 accent-primary"
          />
          <span className="font-medium text-foreground">Ativar lembretes</span>
        </label>

        <QuietHoursForm
          value={value.quietHours}
          disabled={isSaving}
          onChange={(quietHours) => onChange({ ...value, quietHours })}
        />

        <Button
          variant="outline"
          className="h-11 w-full"
          disabled={!isDirty || isSaving}
          onClick={onSave}
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Salvar preferências
        </Button>
      </div>
    </section>
  );
}
