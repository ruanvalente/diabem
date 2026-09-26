import {
  type NotificationQuietHours,
  type NotificationSchedule,
  type NotificationWeekdayKey,
} from "./types";

const WEEKDAY_KEYS_BY_JS_DAY: readonly NotificationWeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const MAX_LOOKAHEAD_DAYS = 8;

export type NotificationLocalDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

export function resolveTimeZone(
  timeZone?: string | null,
  fallback: string = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
): string {
  if (!timeZone) return fallback;
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return fallback;
  }
}

export function getLocalDateParts(
  date: Date,
  timeZone: string = resolveTimeZone(),
): NotificationLocalDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value ?? "0";
    return Number(value);
  };

  const weekdayNames: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    weekday: weekdayNames[parts.find((part) => part.type === "weekday")?.value ?? "Sun"] ?? 0,
  };
}

export function parseClockTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":");
  return { hour: Number(hour), minute: Number(minute) };
}

export function formatClockTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getWeekdayKey(date: Date, timeZone = resolveTimeZone()): NotificationWeekdayKey {
  return WEEKDAY_KEYS_BY_JS_DAY[getLocalDateParts(date, timeZone).weekday];
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getLocalDateParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  return asUtc - date.getTime();
}

function zonedDateToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date | null {
  const targetWallClock = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = new Date(targetWallClock);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = timeZoneOffsetMs(guess, timeZone);
    const next = new Date(targetWallClock - offset);
    if (next.getTime() === guess.getTime()) break;
    guess = next;
  }
  const parts = getLocalDateParts(guess, timeZone);
  if (
    parts.year !== year ||
    parts.month !== month ||
    parts.day !== day ||
    parts.hour !== hour ||
    parts.minute !== minute
  ) {
    return null;
  }
  return guess;
}

function addCalendarDays(parts: NotificationLocalDateParts, days: number): NotificationLocalDateParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12));
  return {
    ...parts,
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

export function getNextOccurrence(
  schedule: Pick<NotificationSchedule, "time" | "daysOfWeek" | "timeZone">,
  from: Date = new Date(),
): Date | null {
  const timeZone = resolveTimeZone(schedule.timeZone);
  const { hour, minute } = parseClockTime(schedule.time);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (schedule.daysOfWeek.length === 0) return null;

  const allowed = new Set<number>(
    schedule.daysOfWeek
      .map((day) => WEEKDAY_KEYS_BY_JS_DAY.indexOf(day))
      .filter((index) => index >= 0),
  );

  const base = getLocalDateParts(from, timeZone);
  const cursor = { ...base, hour: 0, minute: 0 };

  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS; offset += 1) {
    const day = addCalendarDays(cursor, offset);
    if (!allowed.has(day.weekday)) continue;
    const candidate = zonedDateToUtc(day.year, day.month, day.day, hour, minute, timeZone);
    if (!candidate) continue;
    if (candidate.getTime() <= from.getTime()) continue;
    return candidate;
  }

  return null;
}

export function getOccurrenceKey(scheduleId: string, occurrence: Date): string {
  return `${scheduleId}@${occurrence.getTime()}`;
}

export function isWithinQuietHours(
  date: Date,
  quietHours: NotificationQuietHours,
  timeZone: string = resolveTimeZone(),
): boolean {
  if (!quietHours.enabled) return false;
  const { hour, minute } = getLocalDateParts(date, timeZone);
  const current = hour * 60 + minute;
  const start = parseClockTime(quietHours.start);
  const end = parseClockTime(quietHours.end);
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return current >= startMinutes && current < endMinutes;
  }
  return current >= startMinutes || current < endMinutes;
}

export function getDelayUntil(occurrence: Date, now: Date = new Date()): number {
  return Math.max(0, occurrence.getTime() - now.getTime());
}

export function clampTimerDelay(delayMs: number): number {
  const MAX_DELAY = 2 ** 31 - 1;
  return Math.min(Math.max(delayMs, 0), MAX_DELAY);
}
