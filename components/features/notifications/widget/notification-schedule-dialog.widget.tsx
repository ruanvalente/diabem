"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { validateNotificationScheduleInput } from "@/lib/notifications/notification-schedule.validation";
import {
  NOTIFICATION_PERIOD_DEFAULT_TIMES,
  NOTIFICATION_WEEKDAY_PRESETS,
  type NotificationActionResult,
  type NotificationSchedule,
  type NotificationScheduleInput,
  type NotificationWeekdayKey,
  type NotificationWeekdayPreset,
} from "@/lib/notifications/types";
import {
  NotificationScheduleForm,
  resolveWeekdayPreset,
  type NotificationScheduleFormValue,
} from "../ui/notification-schedule-form.ui";

type NotificationScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: NotificationSchedule | null;
  onSubmit: (
    input: NotificationScheduleInput,
  ) => Promise<NotificationActionResult<NotificationSchedule>>;
};

function initialValue(schedule?: NotificationSchedule | null): NotificationScheduleFormValue {
  return {
    label: schedule?.label ?? "",
    period: schedule?.period ?? "morning",
    time: schedule?.time ?? NOTIFICATION_PERIOD_DEFAULT_TIMES.morning,
    enabled: schedule?.enabled ?? true,
    daysOfWeek: schedule?.daysOfWeek ?? [...NOTIFICATION_WEEKDAY_PRESETS.everyDay],
    reminderTypes: schedule?.reminderTypes ?? ["glucose"],
  };
}

export function NotificationScheduleDialog({
  open,
  onOpenChange,
  schedule = null,
  onSubmit,
}: NotificationScheduleDialogProps) {
  const isEditing = Boolean(schedule);
  const [value, setValue] = useState<NotificationScheduleFormValue>(() =>
    initialValue(schedule),
  );
  const [weekdayPreset, setWeekdayPreset] = useState<NotificationWeekdayPreset>(() =>
    resolveWeekdayPreset(initialValue(schedule).daysOfWeek),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeZone = useMemo(
    () => schedule?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    [schedule],
  );

  const handlePresetChange = (preset: NotificationWeekdayPreset) => {
    setWeekdayPreset(preset);
    if (preset === "custom") return;
    setValue((current) => ({
      ...current,
      daysOfWeek: [...NOTIFICATION_WEEKDAY_PRESETS[preset]],
    }));
  };

  const handleChange = (next: NotificationScheduleFormValue) => {
    setValue((current) => ({
      ...next,
      time:
        !isEditing && next.period !== current.period
          ? NOTIFICATION_PERIOD_DEFAULT_TIMES[next.period]
          : next.time,
    }));
    setWeekdayPreset(resolveWeekdayPreset(next.daysOfWeek));
  };

  const handleSubmit = async () => {
    const validation = validateNotificationScheduleInput({
      label: value.label,
      period: value.period,
      time: value.time,
      enabled: value.enabled,
      daysOfWeek: value.daysOfWeek as NotificationWeekdayKey[],
      reminderTypes: value.reminderTypes,
      timeZone,
    });

    if (!validation.data) {
      setError(validation.error ?? "Revise os dados do lembrete.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const result = await onSubmit(validation.data);
    setIsSubmitting(false);

    if (result.ok) {
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar lembrete" : "Adicionar lembrete"}
          </DialogTitle>
          <DialogDescription>
            Escolha o horário, os dias e o que deseja registrar. O lembrete fica
            salvo apenas neste dispositivo.
          </DialogDescription>
        </DialogHeader>

        <NotificationScheduleForm
          value={value}
          onChange={handleChange}
          weekdayPreset={weekdayPreset}
          onWeekdayPresetChange={handlePresetChange}
        />

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="h-11"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Salvar lembrete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
