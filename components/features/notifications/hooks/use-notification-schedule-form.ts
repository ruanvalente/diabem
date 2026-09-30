"use client";

import { useState } from "react";
import {
  NOTIFICATION_PERIOD_DEFAULT_TIMES,
  NOTIFICATION_WEEKDAY_PRESETS,
  type NotificationSchedule,
  type NotificationWeekdayPreset,
} from "@/lib/notifications/types";
import type { NotificationScheduleFormValue } from "../ui/notification-schedule-form.ui";
import { resolveWeekdayPreset } from "../utils/notification-weekday-preset";

type ScheduleFormState = {
  value: NotificationScheduleFormValue;
  weekdayPreset: NotificationWeekdayPreset;
};

/** Prefills the form from the reminder being edited, or from the creation defaults. */
function initialState(
  schedule: NotificationSchedule | null | undefined,
): ScheduleFormState {
  const value: NotificationScheduleFormValue = {
    label: schedule?.label ?? "",
    period: schedule?.period ?? "morning",
    time: schedule?.time ?? NOTIFICATION_PERIOD_DEFAULT_TIMES.morning,
    enabled: schedule?.enabled ?? true,
    daysOfWeek: schedule?.daysOfWeek ?? [...NOTIFICATION_WEEKDAY_PRESETS.everyDay],
    reminderTypes: schedule?.reminderTypes ?? ["glucose"],
  };

  return { value, weekdayPreset: resolveWeekdayPreset(value.daysOfWeek) };
}

/**
 * Owns the editable state of the reminder form and keeps the recurrence control
 * in sync with the selected days. Choosing a period while creating a reminder
 * adopts that period's default time, because the previous time belonged to
 * another period; editing preserves the stored time. The dialog owns validation,
 * submission and error reporting.
 */
export function useNotificationScheduleForm(
  schedule: NotificationSchedule | null | undefined,
) {
  const isEditing = Boolean(schedule);
  const [state, setState] = useState<ScheduleFormState>(() => initialState(schedule));

  const change = (next: NotificationScheduleFormValue) => {
    setState((current) => ({
      value: {
        ...next,
        time:
          !isEditing && next.period !== current.value.period
            ? NOTIFICATION_PERIOD_DEFAULT_TIMES[next.period]
            : next.time,
      },
      weekdayPreset: resolveWeekdayPreset(next.daysOfWeek),
    }));
  };

  const changeWeekdayPreset = (preset: NotificationWeekdayPreset) => {
    setState((current) => ({
      weekdayPreset: preset,
      value:
        preset === "custom"
          ? current.value
          : { ...current.value, daysOfWeek: [...NOTIFICATION_WEEKDAY_PRESETS[preset]] },
    }));
  };

  return {
    isEditing,
    value: state.value,
    weekdayPreset: state.weekdayPreset,
    change,
    changeWeekdayPreset,
  };
}