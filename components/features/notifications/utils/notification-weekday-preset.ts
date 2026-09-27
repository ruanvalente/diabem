import {
  NOTIFICATION_WEEKDAY_PRESETS,
  type NotificationWeekdayKey,
  type NotificationWeekdayPreset,
} from "@/lib/notifications/types";

type WeekdayPresetName = Exclude<NotificationWeekdayPreset, "custom">;

function matchesPreset(
  days: readonly NotificationWeekdayKey[],
  preset: WeekdayPresetName,
): boolean {
  const expected = NOTIFICATION_WEEKDAY_PRESETS[preset];
  return (
    days.length === expected.length && expected.every((day) => days.includes(day))
  );
}

/**
 * Recurrence presets are a domain rule, not presentation: the dialog resolves
 * the preset whenever the days change and the form renders it as selected. It
 * lives here so the widget layer does not have to import a rule from a UI
 * module.
 */
export function resolveWeekdayPreset(
  days: readonly NotificationWeekdayKey[],
): NotificationWeekdayPreset {
  const preset = (Object.keys(NOTIFICATION_WEEKDAY_PRESETS) as WeekdayPresetName[]).find(
    (candidate) => matchesPreset(days, candidate),
  );
  return preset ?? "custom";
}
