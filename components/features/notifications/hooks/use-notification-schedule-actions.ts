"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import type {
  NotificationActionResult,
  NotificationSchedule,
  NotificationScheduleInput,
} from "@/lib/notifications/types";
import type { useNotificationSchedules } from "./use-notification-schedules";

/**
 * The mutation surface the section triggers. It is taken from the schedule hook
 * itself so the actions reuse the already loaded state instead of subscribing to
 * the reminders a second time.
 */
type ScheduleMutations = Pick<
  ReturnType<typeof useNotificationSchedules>,
  "create" | "update" | "setEnabled" | "remove"
>;

/**
 * Owns what happens around a reminder mutation: the pending state that disables
 * the list while one runs, and the toast that reports its outcome. The widget
 * only chooses which mutation to run and which message confirms it.
 */
export function useNotificationScheduleActions({
  create,
  update,
  setEnabled,
  remove,
}: ScheduleMutations) {
  const [isPending, setIsPending] = useState(false);

  /**
   * Every reminder mutation blocks the list while it runs and reports the
   * failure. A `successMessage` is only passed by the mutations that confirm
   * the outcome to the user, as toggling a reminder is self-evident.
   */
  const runMutation = async <T,>(
    mutation: () => Promise<NotificationActionResult<T>>,
    successMessage?: string,
  ): Promise<NotificationActionResult<T>> => {
    setIsPending(true);
    const result = await mutation();
    setIsPending(false);

    if (!result.ok) {
      toast.add({ title: result.error, type: "error" });
      return result;
    }
    if (successMessage) {
      toast.add({ title: successMessage, type: "success" });
    }
    return result;
  };

  /**
   * Creates or updates depending on whether a reminder is being edited, so the
   * dialog does not need to know which of the two it is saving.
   */
  const submit = (
    input: NotificationScheduleInput,
    editing: NotificationSchedule | null,
  ) =>
    editing
      ? runMutation(
          () => update(editing.id, input),
          "Lembrete atualizado com sucesso.",
        )
      : runMutation(() => create(input), "Lembrete criado com sucesso.");

  const toggle = (schedule: NotificationSchedule) =>
    runMutation(() => setEnabled(schedule.id, !schedule.enabled));

  const removeSchedule = (schedule: NotificationSchedule) =>
    runMutation(() => remove(schedule.id), "Lembrete excluído.");

  return { isPending, submit, toggle, remove: removeSchedule };
}
