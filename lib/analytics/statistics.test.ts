import { describe, expect, it } from "vitest";
import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import {
  computeGlucoseStatistics,
  computeActivityStatistics,
  computeMealStatistics,
  computeNoteStatistics,
} from "./statistics";

function glucoseReading(
  id: string,
  value: number,
  context: GlucoseReading["context"] = "fasting",
  measuredAt?: string
): GlucoseReading {
  const at = measuredAt ?? new Date().toISOString();
  return {
    id,
    userId: "u",
    value,
    unit: "mg/dL",
    context,
    measuredAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

function meal(id: string, type: Meal["type"] = "lunch", consumedAt?: string): Meal {
  const at = consumedAt ?? new Date().toISOString();
  return {
    id,
    userId: "u",
    type,
    description: "Test meal",
    consumedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

function activity(
  id: string,
  durationMinutes: number,
  type: Activity["type"] = "walking",
  startedAt?: string
): Activity {
  const at = startedAt ?? new Date().toISOString();
  return {
    id,
    userId: "u",
    type,
    durationMinutes,
    startedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

function note(id: string, content = "Test note"): Note {
  const at = new Date().toISOString();
  return {
    id,
    userId: "u",
    content,
    createdAt: at,
    updatedAt: at,
  };
}

describe("computeGlucoseStatistics", () => {
  it("returns default values for empty array", () => {
    const stats = computeGlucoseStatistics([]);
    expect(stats.count).toBe(0);
    expect(stats.average).toBeNull();
    expect(stats.minimum).toBeNull();
    expect(stats.maximum).toBeNull();
    expect(stats.inRangePercentage).toBeNull();
    expect(stats.hasEnoughData).toBe(false);
    expect(stats.contextDistribution).toHaveLength(0);
    expect(stats.rangeDistribution).toHaveLength(0);
  });

  it("computes basic statistics from readings", () => {
    const readings = [
      glucoseReading("1", 100, "fasting"),
      glucoseReading("2", 140, "before_meal"),
      glucoseReading("3", 180, "after_meal"),
    ];
    const stats = computeGlucoseStatistics(readings);

    expect(stats.count).toBe(3);
    expect(stats.average).toBe(140);
    expect(stats.minimum).toBe(100);
    expect(stats.maximum).toBe(180);
    expect(stats.hasEnoughData).toBe(true);
  });

  it("computes in-range percentage correctly", () => {
    const readings = [
      glucoseReading("1", 100), // in_range (70-140)
      glucoseReading("2", 120), // in_range
      glucoseReading("3", 160), // high
    ];
    const stats = computeGlucoseStatistics(readings);
    expect(stats.inRangePercentage).toBe(67);
  });

  it("groups context distribution correctly", () => {
    const readings = [
      glucoseReading("1", 100, "fasting"),
      glucoseReading("2", 120, "fasting"),
      glucoseReading("3", 150, "before_meal"),
    ];
    const stats = computeGlucoseStatistics(readings);
    expect(stats.contextDistribution).toHaveLength(2);
    expect(stats.contextDistribution[0]).toEqual({
      context: "fasting",
      label: "Jejum",
      count: 2,
    });
    expect(stats.contextDistribution[1]).toEqual({
      context: "before_meal",
      label: "Antes da refeição",
      count: 1,
    });
  });

  it("classifies range distribution correctly", () => {
    const readings = [
      glucoseReading("1", 60),  // low
      glucoseReading("2", 100), // in_range
      glucoseReading("3", 160), // high
      glucoseReading("4", 200), // very_high
    ];
    const stats = computeGlucoseStatistics(readings);
    expect(stats.rangeDistribution).toHaveLength(4);
    expect(stats.rangeDistribution.find((r) => r.range === "low")?.count).toBe(1);
    expect(stats.rangeDistribution.find((r) => r.range === "in_range")?.count).toBe(1);
    expect(stats.rangeDistribution.find((r) => r.range === "high")?.count).toBe(1);
    expect(stats.rangeDistribution.find((r) => r.range === "very_high")?.count).toBe(1);
  });

  it("determines trend direction from data", () => {
    const readings = [
      glucoseReading("1", 100, "fasting", "2026-09-01T08:00:00Z"),
      glucoseReading("2", 110, "fasting", "2026-09-02T08:00:00Z"),
      glucoseReading("3", 120, "fasting", "2026-09-03T08:00:00Z"),
      glucoseReading("4", 130, "fasting", "2026-09-04T08:00:00Z"),
      glucoseReading("5", 140, "fasting", "2026-09-05T08:00:00Z"),
    ];
    const stats = computeGlucoseStatistics(readings);
    expect(stats.trendDirection).toBe("increasing");
  });

  it("marks insufficient data for single reading", () => {
    const stats = computeGlucoseStatistics([glucoseReading("1", 100)]);
    expect(stats.hasEnoughData).toBe(false);
  });
});

describe("computeActivityStatistics", () => {
  const range = {
    from: "2026-09-01T00:00:00Z",
    to: "2026-09-08T00:00:00Z",
  };

  it("returns default values for empty array", () => {
    const stats = computeActivityStatistics([], range);
    expect(stats.totalCount).toBe(0);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.averageMinutesPerDay).toBeNull();
    expect(stats.hasEnoughData).toBe(false);
  });

  it("computes totals correctly", () => {
    const activities = [
      activity("1", 30, "walking"),
      activity("2", 45, "running"),
      activity("3", 20, "walking"),
    ];
    const stats = computeActivityStatistics(activities, range);
    expect(stats.totalCount).toBe(3);
    expect(stats.totalMinutes).toBe(95);
    expect(stats.hasEnoughData).toBe(true);
  });

  it("groups by type correctly", () => {
    const activities = [
      activity("1", 30, "walking"),
      activity("2", 45, "running"),
      activity("3", 20, "walking"),
    ];
    const stats = computeActivityStatistics(activities, range);
    expect(stats.byType).toHaveLength(2);
    const walking = stats.byType.find((t) => t.type === "walking");
    expect(walking?.count).toBe(2);
    expect(walking?.totalMinutes).toBe(50);
  });
});

describe("computeMealStatistics", () => {
  it("returns default values for empty array", () => {
    const stats = computeMealStatistics([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.byType).toHaveLength(0);
    expect(stats.hasEnoughData).toBe(false);
  });

  it("computes meal counts by type", () => {
    const meals = [
      meal("1", "breakfast"),
      meal("2", "lunch"),
      meal("3", "lunch"),
      meal("4", "dinner"),
    ];
    const stats = computeMealStatistics(meals);
    expect(stats.totalCount).toBe(4);
    expect(stats.byType).toHaveLength(3);
    expect(stats.hasEnoughData).toBe(true);

    const lunch = stats.byType.find((t) => t.type === "lunch");
    expect(lunch?.count).toBe(2);
    expect(lunch?.label).toBe("Almoço");
  });

  it("distributes meals by time of day", () => {
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const morning = new Date(baseDate.getTime() + 8 * 60 * 60 * 1000).toISOString();
    const afternoon = new Date(baseDate.getTime() + 14 * 60 * 60 * 1000).toISOString();
    const evening = new Date(baseDate.getTime() + 20 * 60 * 60 * 1000).toISOString();
    const meals = [
      meal("1", "breakfast", morning),
      meal("2", "lunch", afternoon),
      meal("3", "dinner", evening),
    ];
    const stats = computeMealStatistics(meals);
    expect(stats.distributionByTimeOfDay.total).toBe(3);
    expect(stats.distributionByTimeOfDay.items[0].count).toBe(1); // morning
    expect(stats.distributionByTimeOfDay.items[1].count).toBe(1); // afternoon
    expect(stats.distributionByTimeOfDay.items[2].count).toBe(1); // evening
  });
});

describe("computeNoteStatistics", () => {
  it("returns default values for empty array", () => {
    const stats = computeNoteStatistics([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.hasEnoughData).toBe(false);
  });

  it("counts notes correctly", () => {
    const notes = [note("1"), note("2"), note("3")];
    const stats = computeNoteStatistics(notes);
    expect(stats.totalCount).toBe(3);
    expect(stats.hasEnoughData).toBe(true);
  });
});
