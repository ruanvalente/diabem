import { describe, expect, it } from "vitest";
import {
  addDays,
  dayLabel,
  fromDateTimeLocalValue,
  getLocalDayKey,
  groupByLocalDay,
  resolvePeriodRange,
  startOfLocalDay,
  toDateTimeLocalValue,
  formatTime,
  formatDateShort,
} from "./date";

describe("date helpers", () => {
  it("round-trips a datetime-local value through UTC storage without drift", () => {
    const local = new Date(2026, 7, 28, 8, 30, 15); // 28/08/2026 08:30:15 local
    const localValue = toDateTimeLocalValue(local);
    expect(localValue).toBe("2026-08-28T08:30");

    const stored = fromDateTimeLocalValue(localValue);
    expect(stored).not.toBeNull();

    expect(toDateTimeLocalValue(new Date(stored!))).toBe(localValue);
    expect(fromDateTimeLocalValue("")).toBeNull();
    expect(fromDateTimeLocalValue("not-a-date")).toBeNull();
  });

  it("accumulates no wall-clock drift across the round trip", () => {
    const now = new Date();
    const roundtrip = toDateTimeLocalValue(new Date(fromDateTimeLocalValue(toDateTimeLocalValue(now))!));
    expect(roundtrip).toBe(toDateTimeLocalValue(now));
  });

  it("displays the stored instant back in the same local wall-clock time", () => {
    // A reading taken at 23:30 local on the 28th must be displayed as 23:30,
    // never shifted to the next day (the "28/08 23:30 => 29/08 02:30" bug).
    const local = new Date(2026, 7, 28, 23, 30);
    const stored = local.toISOString();
    const formatted = formatTime(stored);
    expect(formatted).toBe("23:30");
  });

  it("formats ISO instants in iso-8601-local-independent ways", () => {
    const iso = new Date(2026, 7, 28, 8, 30).toISOString();
    expect(formatTime(iso)).toBe("08:30");
    expect(formatDateShort(iso)).toMatch(/^28\/08/);
  });

  it("starts a local day at midnight", () => {
    const day = startOfLocalDay(new Date(2026, 7, 28, 18, 45));
    expect(day.getHours()).toBe(0);
    expect(getLocalDayKey(day)).toBe("2026-08-28");
  });

  it("labels days as Hoje, Ontem or the weekday/date", () => {
    const today = new Date(2026, 7, 28, 12, 0);
    expect(dayLabel(new Date(2026, 7, 28, 9, 0).toISOString(), today)).toBe("Hoje");
    expect(dayLabel(new Date(2026, 7, 27, 9, 0).toISOString(), today)).toBe("Ontem");
    const other = dayLabel(new Date(2026, 7, 20, 9, 0).toISOString(), today);
    expect(other).not.toBe("Hoje");
    expect(other).not.toBe("Ontem");
    expect(other.length).toBeGreaterThan(0);
  });

  describe("resolvePeriodRange", () => {
    const now = new Date(2026, 7, 28, 18, 30);

    it("resolves today to the current local day in UTC instants", () => {
      const { from, to } = resolvePeriodRange("today", now);
      expect(new Date(from!).getHours()).toBe(0);
      expect(toDateTimeLocalValue(new Date(from!))).toBe("2026-08-28T00:00");
      expect(new Date(to!)).toEqual(addDays(startOfLocalDay(now), 1));
    });

    it("resolves week to the last 7 local days", () => {
      const { from, to } = resolvePeriodRange("week", now);
      expect(new Date(from!)).toEqual(addDays(startOfLocalDay(now), -6));
      expect(new Date(to!).getTime()).toBeGreaterThan(new Date(from!).getTime());
    });

    it("resolves month to the current local month boundaries", () => {
      const { from, to } = resolvePeriodRange("month", now);
      expect(from).toBe(new Date(2026, 7, 1).toISOString());
      expect(to).toBe(new Date(2026, 8, 1).toISOString());
    });

    it("resolves all to an unbounded range", () => {
      expect(resolvePeriodRange("all", now)).toEqual({});
    });
  });

  describe("groupByLocalDay", () => {
    const items = [
      { id: "a", ts: new Date(2026, 7, 27, 23, 30).toISOString() },
      { id: "b", ts: new Date(2026, 7, 28, 8, 0).toISOString() },
      { id: "c", ts: new Date(2026, 7, 28, 18, 0).toISOString() },
    ];

    it("groups by local day, days descending and items descending", () => {
      const groups = groupByLocalDay(items, (item) => item.ts);
      expect(groups).toHaveLength(2);
      expect(groups[0].dayKey).toBe("2026-08-28");
      expect(groups[0].label).toBe("Hoje");
      expect(groups[0].items.map((item) => item.id)).toEqual(["c", "b"]);
      expect(groups[1].dayKey).toBe("2026-08-27");
      expect(groups[1].label).toBe("Ontem");
      expect(groups[1].items.map((item) => item.id)).toEqual(["a"]);
    });
  });
});