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
import type {
  NotificationActionResult,
  NotificationSchedule,
  NotificationScheduleInput,
} from "@/lib/notifications/types";
import { useNotificationScheduleForm } from "../hooks/use-notification-schedule-form";
import { NotificationScheduleForm } from "../ui/notification-schedule-form.ui";

type NotificationScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: NotificationSchedule | null;
  onSubmit: (
    input: NotificationScheduleInput,
  ) => Promise<NotificationActionResult<NotificationSchedule>>;
};

export function NotificationScheduleDialog({
  open,
  onOpenChange,
  schedule = null,
  onSubmit,
}: NotificationScheduleDialogProps) {
  const { isEditing, value, weekdayPreset, change, changeWeekdayPreset } =
    useNotificationScheduleForm(schedule);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeZone = useMemo(
    () => schedule?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    [schedule],
  );

  const handleSubmit = async () => {
    const validation = validateNotificationScheduleInput({
      ...value,
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
          onChange={change}
          weekdayPreset={weekdayPreset}
          onWeekdayPresetChange={changeWeekdayPreset}
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
