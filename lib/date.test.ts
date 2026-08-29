import { describe, expect, it } from "vitest";
import {
  addDays,
  dayLabel,
  fromDateTimeLocalValue,
  getLocalDayKey,
  groupByLocalDay,
  resolveCustomPeriodRange,
  resolvePeriodRange,
  resolvePeriodSelectionRange,
  startOfLocalDay,
  toDateTimeLocalValue,
  formatTime,
  formatDateShort,
  formatDateLong,
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
    const roundtrip = toDateTimeLocalValue(
      new Date(fromDateTimeLocalValue(toDateTimeLocalValue(now))!),
    );
    expect(roundtrip).toBe(toDateTimeLocalValue(now));
  });

  it("displays the stored instant back in the same local wall-clock time", () => {
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
    expect(dayLabel(new Date(2026, 7, 28, 9, 0).toISOString(), today)).toBe(
      "Hoje",
    );
    expect(dayLabel(new Date(2026, 7, 27, 9, 0).toISOString(), today)).toBe(
      "Ontem",
    );
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
      expect(new Date(to!).getTime()).toBeGreaterThan(
        new Date(from!).getTime(),
      );
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

  describe("resolveCustomPeriodRange", () => {
    it("resolves an inclusive local date range into UTC instants", () => {
      const range = resolveCustomPeriodRange("2026-08-01", "2026-08-29");
      expect(range).not.toBeNull();
      expect(toDateTimeLocalValue(new Date(range!.from))).toBe(
        "2026-08-01T00:00",
      );
      expect(toDateTimeLocalValue(new Date(range!.to))).toBe(
        "2026-08-30T00:00",
      );
    });

    it("rejects an end date before the start date", () => {
      expect(resolveCustomPeriodRange("2026-08-29", "2026-08-01")).toBeNull();
    });

    it("allows a single-day range", () => {
      const range = resolveCustomPeriodRange("2026-08-28", "2026-08-28");
      expect(range).not.toBeNull();
      if (range) {
        expect(toDateTimeLocalValue(new Date(range.from))).toBe(
          "2026-08-28T00:00",
        );
        expect(toDateTimeLocalValue(new Date(range.to))).toBe(
          "2026-08-29T00:00",
        );
      }
    });

    it("rejects empty or malformed dates", () => {
      expect(resolveCustomPeriodRange("", "2026-08-01")).toBeNull();
      expect(resolveCustomPeriodRange("not-a-date", "2026-08-01")).toBeNull();
    });
  });

  describe("resolvePeriodSelectionRange", () => {
    it("resolves preset periods", () => {
      const now = new Date(2026, 7, 28, 12);
      const range = resolvePeriodSelectionRange(
        { period: "today", custom: null },
        now,
      );
      expect(toDateTimeLocalValue(new Date(range.from!))).toBe(
        "2026-08-28T00:00",
      );
    });

    it("resolves custom ranges and falls back to empty when invalid", () => {
      expect(
        resolvePeriodSelectionRange({
          period: "custom",
          custom: { from: "2026-08-01", to: "2026-08-29" },
        }),
      ).not.toBeNull();

      expect(
        resolvePeriodSelectionRange({
          period: "custom",
          custom: { from: "2026-08-29", to: "2026-08-01" },
        }),
      ).toEqual({});

      expect(
        resolvePeriodSelectionRange({ period: "custom", custom: null }),
      ).toEqual({});
    });

    it("resolves all as an unbounded range", () => {
      expect(
        resolvePeriodSelectionRange({ period: "all", custom: null }),
      ).toEqual({});
    });
  });

  describe("formatDateLong", () => {
    it("renders a long local date", () => {
      const iso = new Date(2026, 7, 28, 8, 0).toISOString();
      expect(formatDateLong(iso)).toContain("28");
      expect(formatDateLong(iso)).toContain("agosto");
    });
  });

  describe("groupByLocalDay", () => {
    const items = [
      { id: "a", ts: new Date(2026, 7, 27, 23, 30).toISOString() },
      { id: "b", ts: new Date(2026, 7, 28, 8, 0).toISOString() },
      { id: "c", ts: new Date(2026, 7, 28, 18, 0).toISOString() },
    ];

    it("groups by local day, days descending and items descending", () => {
      const now = new Date(2026, 7, 28, 12, 0);
      const groups = groupByLocalDay(items, (item) => item.ts, now);
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
