const DAY_MS = 24 * 60 * 60 * 1000;

export type PeriodFilter = "today" | "week" | "month" | "all";

export type PeriodFilterWithCustom = PeriodFilter | "custom";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

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

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function formatDateMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekdayShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

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

export function resolveCustomPeriodRange(
  fromLocal: string,
  toLocal: string,
): { from: string; to: string } | null {
  const from = new Date(`${fromLocal}T00:00:00`);
  const to = new Date(`${toLocal}T00:00:00`);
  if (
    !fromLocal ||
    !toLocal ||
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime())
  ) {
    return null;
  }
  if (from.getTime() > to.getTime()) return null;

  return {
    from: startOfLocalDay(from).toISOString(),
    to: addDays(startOfLocalDay(to), 1).toISOString(),
  };
}

export type CustomPeriodRange = {
  from: string;
  to: string;
};

export type PeriodSelection = {
  period: PeriodFilterWithCustom;
  custom: CustomPeriodRange | null;
};

export const PERIOD_LABELS: Record<PeriodFilterWithCustom, string> = {
  today: "Hoje",
  week: "Últimos 7 dias",
  month: "Este mês",
  all: "Todo o período",
  custom: "Personalizado",
};

export function formatPeriodRangeLabel(custom: CustomPeriodRange): string {
  const fromIso = new Date(`${custom.from}T00:00:00`).toISOString();
  const toIso = new Date(`${custom.to}T00:00:00`).toISOString();
  return `de ${formatDateShort(fromIso)} a ${formatDateShort(toIso)}`;
}

export function periodAdverbial(selection: PeriodSelection): string {
  if (selection.period === "custom" && selection.custom) {
    return "no período selecionado";
  }
  switch (selection.period) {
    case "today":
      return "hoje";
    case "week":
      return "na última semana";
    case "month":
      return "neste mês";
    case "all":
      return "em todo o período";
    case "custom":
      return "neste período";
  }
}

export function resolvePeriodSelectionRange(
  selection: PeriodSelection,
  now: Date = new Date(),
): { from?: string; to?: string } {
  if (selection.period === "custom") {
    if (!selection.custom) return {};
    return (
      resolveCustomPeriodRange(selection.custom.from, selection.custom.to) ?? {}
    );
  }
  return resolvePeriodRange(selection.period, now);
}

export type DayGroup<T> = {
  dayKey: string;
  label: string;
  items: T[];
};

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
