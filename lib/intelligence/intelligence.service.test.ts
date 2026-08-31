import { describe, expect, it } from "vitest";
import {
  analyzeIntelligence,
  getGlucoseSummary,
  getMealSummary,
  getActivitySummary,
  getTimeline,
} from "./intelligence.service";
import { glucoseReading, meal, activity, note } from "./__fixtures__";
import type { AnalysisPeriod } from "./types/analytics.types";

const PERIOD: AnalysisPeriod = {
  start: new Date(2026, 7, 22).toISOString(),
  end: new Date(2026, 7, 29).toISOString(),
};

function manyGlucose(count: number, value = 120) {
  const readings = [];
  for (let i = 0; i < count; i++) {
    const day = (i % 7) + 22;
    readings.push(
      glucoseReading(`g${i}`, value, { y: 2026, mo: 7, d: day, h: 9 })
    );
  }
  return readings;
}

describe("analyzeIntelligence", () => {
  it("returns a full analysis result", () => {
    const glucose = manyGlucose(12, 130);
    const meals = [meal("m1", { y: 2026, mo: 7, d: 23, h: 12 })];
    const activities = [activity("a1", { y: 2026, mo: 7, d: 23, h: 18 }, 30)];

    const result = analyzeIntelligence(glucose, meals, activities, [], PERIOD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.period).toEqual(PERIOD);
    expect(result.data.patterns.length).toBeGreaterThan(0);
    expect(result.data.insights.length).toBeGreaterThan(0);
    expect(result.data.analytics.glucose?.stats.count).toBe(12);
  });

  it("produces insufficient_data insight for a small dataset", () => {
    const glucose = [glucoseReading("g1", 120, { y: 2026, mo: 7, d: 23, h: 9 })];
    const result = analyzeIntelligence(glucose, [], [], [], PERIOD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.data.insights.some((i) => i.type === "insufficient_data")
    ).toBe(true);
  });

  it("works with an empty dataset", () => {
    const result = analyzeIntelligence([], [], [], [], PERIOD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.patterns.length).toBe(1);
    expect(result.data.insights).toHaveLength(1);
  });
});

describe("summary helpers", () => {
  it("getGlucoseSummary returns counts and aggregates", () => {
    const glucose = [
      glucoseReading("g1", 100, { y: 2026, mo: 7, d: 23, h: 8 }),
      glucoseReading("g2", 120, { y: 2026, mo: 7, d: 24, h: 9 }),
    ];
    const analytics = analyzeIntelligence(glucose, [], [], [], PERIOD);
    if (!analytics.ok) throw new Error("analysis failed");
    const summary = getGlucoseSummary(analytics.data.analytics);
    expect(summary.count).toBe(2);
    expect(summary.average).toBe(110);
  });

  it("getMealSummary and getActivitySummary return aggregates", () => {
    const meals = [meal("m1", { y: 2026, mo: 7, d: 23, h: 12 })];
    const activities = [activity("a1", { y: 2026, mo: 7, d: 23, h: 18 }, 45)];
    const analytics = analyzeIntelligence([], meals, activities, [], PERIOD);
    if (!analytics.ok) throw new Error("analysis failed");
    expect(getMealSummary(analytics.data.analytics).totalCount).toBe(1);
    expect(getActivitySummary(analytics.data.analytics).totalMinutes).toBe(45);
  });

  it("getTimeline returns merged chronological events", () => {
    const events = getTimeline(
      [glucoseReading("g1", 100, { y: 2026, mo: 7, d: 25, h: 8 })],
      [meal("m1", { y: 2026, mo: 7, d: 26, h: 12 })],
      [activity("a1", { y: 2026, mo: 7, d: 23, h: 18 }, 30)],
      [note("n1", { y: 2026, mo: 7, d: 24, h: 10 })]
    );
    expect(events.map((e) => e.type)).toEqual([
      "meal",
      "glucose",
      "note",
      "activity",
    ]);
  });
});
