const DAY_MS = 24 * 60 * 60 * 1000;

export type PeriodFilter = "today" | "week" | "month" | "all";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Converts a Date into the `yyyy-MM-ddTHH:mm` value expected by an
 * `<input type="datetime-local">`, expressed in the user's local timezone.
 */
export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Parses a `datetime-local` value (interpreted as local wall-clock time) and
 * returns the equivalent instant as an ISO 8601 UTC string, or null when the
 * value is empty or invalid.
 */
export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Local `yyyy-MM-dd` key used to group records by day. */
export function getLocalDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return getLocalDayKey(a) === getLocalDayKey(b);
}

/** Local time, e.g. `08:30`. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Local date, e.g. `28/08/26`. */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Local short date, e.g. `28 de agosto` (no year). */
export function formatDateMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

/** Human friendly day header: `Hoje`, `Ontem` or the local date. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const today = startOfLocalDay(now);
  const day = startOfLocalDay(date);
  const diffDays = Math.round((today.getTime() - day.getTime()) / DAY_MS);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });
}

/**
 * Maps a period shortcut to an inclusive UTC range so records can be queried
 * by their stored timestamps. Boundaries represent the user's local calendar
 * day/month, converted to UTC instants.
 */
export function resolvePeriodRange(
  period: PeriodFilter,
  now: Date = new Date(),
): { from?: string; to?: string } {
  switch (period) {
    case "today": {
      const from = startOfLocalDay(now);
      return { from: from.toISOString(), to: addDays(from, 1).toISOString() };
    }
    case "week": {
      const from = addDays(startOfLocalDay(now), -6);
      return { from: from.toISOString(), to: addDays(from, 7).toISOString() };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case "all":
      return {};
  }
}

export type DayGroup<T> = {
  dayKey: string;
  label: string;
  items: T[];
};

/**
 * Groups records into local-day buckets, newest day first and newest item
 * first within each day.
 */
export function groupByLocalDay<T>(
  items: T[],
  getTimestamp: (item: T) => string,
  now: Date = new Date(),
): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();
  const sorted = [...items].sort((a, b) =>
    getTimestamp(b).localeCompare(getTimestamp(a)),
  );

  for (const item of sorted) {
    const dayKey = getLocalDayKey(new Date(getTimestamp(item)));
    const existing = groups.get(dayKey);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(dayKey, {
        dayKey,
        label: dayLabel(getTimestamp(item), now),
        items: [item],
      });
    }
  }

  return [...groups.values()].sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}