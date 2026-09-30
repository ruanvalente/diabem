import { Button } from "@/components/ui/button";
import type { NotificationSchedule } from "@/lib/notifications/types";
import { Loader2, Plus } from "lucide-react";
import { NotificationScheduleList } from "./notification-schedule-list.ui";

type NotificationRemindersSectionProps = {
  schedules: NotificationSchedule[];
  isLoading: boolean;
  error: string | null;
  isPending: boolean;
  canManage: boolean;
  onCreate: () => void;
  onToggle: (schedule: NotificationSchedule) => void;
  onEdit: (schedule: NotificationSchedule) => void;
  onRemove: (schedule: NotificationSchedule) => void;
};

/**
 * Reminder management block of the settings card: the list with its
 * loading/error/empty states, the action that opens the editor and the reason
 * why that action is unavailable. It only receives data and callbacks — whether
 * reminders can be managed is decided by the widget, which owns the permission.
 */
export function NotificationRemindersSection({
  schedules,
  isLoading,
  error,
  isPending,
  canManage,
  onCreate,
  onToggle,
  onEdit,
  onRemove,
}: NotificationRemindersSectionProps) {
  return (
    <section aria-labelledby="notification-reminders-title" className="px-5 py-4">
      <h3 id="notification-reminders-title" className="text-sm font-medium text-foreground">
        Lembretes
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Defina os horários e os tipos de registro que você quer lembrar. Tudo fica
        salvo apenas neste dispositivo.
      </p>

      <div className="mt-3">
        {isLoading ? (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Carregando lembretes…
          </p>
        ) : error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : (
          <NotificationScheduleList
            schedules={schedules}
            isPending={isPending}
            onToggle={onToggle}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        )}
      </div>

      <Button
        variant="outline"
        className="mt-4 h-11 w-full"
        disabled={!canManage || isLoading}
        onClick={onCreate}
      >
        <Plus className="size-4" aria-hidden="true" />
        Adicionar lembrete
      </Button>

      {!canManage ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Ative a permissão de notificações no navegador para gerenciar lembretes.
        </p>
      ) : null}
    </section>
  );
}
