import type { TimeOfDay, TimeSlotStats } from "../types/analytics.types";

export type TimeSlotRange = {
  start: number;
  end: number;
};

export const TIME_SLOTS: Record<TimeOfDay, TimeSlotRange> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 24 },
  night: { start: 0, end: 6 },
};

export const TIME_SLOT_ORDER: TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
  "night",
];

export const TIME_SLOT_LABELS: Record<TimeOfDay, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  night: "Madrugada",
};

export function getTimeOfDay(iso: string): TimeOfDay {
  const hour = new Date(iso).getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "night";
}

export function groupByTimeOfDay(
  timestamps: { timestamp: string; value: number }[]
): TimeSlotStats[] {
  const groups = new Map<TimeOfDay, number[]>();

  for (const slot of TIME_SLOT_ORDER) {
    groups.set(slot, []);
  }

  for (const item of timestamps) {
    const slot = getTimeOfDay(item.timestamp);
    groups.get(slot)!.push(item.value);
  }

  return TIME_SLOT_ORDER.map((period) => {
    const values = groups.get(period)!;
    if (values.length === 0) {
      return { period, count: 0 };
    }
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      period,
      count: values.length,
      average: Math.round(avg * 100) / 100,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    };
  });
}
