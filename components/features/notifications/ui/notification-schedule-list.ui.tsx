import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NOTIFICATION_PERIOD_LABELS,
  NOTIFICATION_REMINDER_TYPE_LABELS,
  NOTIFICATION_WEEKDAY_SHORT_LABELS,
  type NotificationSchedule,
} from "@/lib/notifications/types";
import { Clock, Pencil, Trash2 } from "lucide-react";

function summarizeDays(days: NotificationSchedule["daysOfWeek"]): string {
  if (days.length === 7) return "Todos os dias";
  if (days.length === 5 && !days.includes("saturday") && !days.includes("sunday")) {
    return "Dias úteis";
  }
  if (days.length === 2 && days.includes("saturday") && days.includes("sunday")) {
    return "Fim de semana";
  }
  return days.map((day) => NOTIFICATION_WEEKDAY_SHORT_LABELS[day]).join(", ");
}

type NotificationScheduleListProps = {
  schedules: NotificationSchedule[];
  onToggle: (schedule: NotificationSchedule) => void;
  onEdit: (schedule: NotificationSchedule) => void;
  onRemove: (schedule: NotificationSchedule) => void;
  isPending: boolean;
};

export function NotificationScheduleList({
  schedules,
  onToggle,
  onEdit,
  onRemove,
  isPending,
}: NotificationScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum lembrete configurado. Adicione um lembrete para receber um aviso no
        horário escolhido.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {schedules.map((schedule) => (
        <li
          key={schedule.id}
          className="rounded-xl border border-border p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {schedule.time}
                <span className="truncate text-muted-foreground">
                  · {NOTIFICATION_PERIOD_LABELS[schedule.period]}
                </span>
              </p>
              {schedule.label ? (
                <p className="mt-0.5 truncate text-sm text-foreground">{schedule.label}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {summarizeDays(schedule.daysOfWeek)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {schedule.reminderTypes
                  .map((type) => NOTIFICATION_REMINDER_TYPE_LABELS[type])
                  .join(" · ")}
              </p>
            </div>
            <Badge variant={schedule.enabled ? "default" : "secondary"}>
              {schedule.enabled ? "Ativo" : "Desativado"}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm">
              <input
                type="checkbox"
                checked={schedule.enabled}
                disabled={isPending}
                onChange={() => onToggle(schedule)}
                className="size-4 accent-primary"
              />
              <span>{schedule.enabled ? "Desativar" : "Ativar"}</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              className="h-11"
              disabled={isPending}
              onClick={() => onEdit(schedule)}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => onRemove(schedule)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
