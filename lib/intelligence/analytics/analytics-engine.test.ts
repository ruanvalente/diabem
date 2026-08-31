import { describe, expect, it } from "vitest";
import { computeIntelligenceAnalytics } from "./analytics-engine";
import { glucoseReading, meal, activity } from "../__fixtures__";
import type { AnalysisPeriod } from "../types/analytics.types";

const PERIOD: AnalysisPeriod = {
  start: new Date(2026, 7, 22).toISOString(),
  end: new Date(2026, 7, 29).toISOString(),
};

describe("computeIntelligenceAnalytics", () => {
  it("computes glucose stats", () => {
    const glucose = [
      glucoseReading("g1", 100, { y: 2026, mo: 7, d: 23, h: 8 }),
      glucoseReading("g2", 120, { y: 2026, mo: 7, d: 24, h: 9 }),
      glucoseReading("g3", 140, { y: 2026, mo: 7, d: 25, h: 12 }),
    ];

    const result = computeIntelligenceAnalytics(glucose, [], [], PERIOD);
    expect(result.glucose?.stats.count).toBe(3);
    expect(result.glucose?.stats.average).toBe(120);
    expect(result.glucose?.stats.minimum).toBe(100);
    expect(result.glucose?.stats.maximum).toBe(140);
  });

  it("leaves glucose undefined when empty", () => {
    const result = computeIntelligenceAnalytics([], [], [], PERIOD);
    expect(result.glucose).toBeUndefined();
  });

  it("computes meal analytics grouped by type", () => {
    const meals = [
      meal("m1", { y: 2026, mo: 7, d: 23, h: 12 }),
      meal("m2", { y: 2026, mo: 7, d: 24, h: 12 }),
      meal("m3", { y: 2026, mo: 7, d: 25, h: 20 }),
    ];

    const result = computeIntelligenceAnalytics([], meals, [], PERIOD);
    expect(result.meals?.totalCount).toBe(3);
    const lunch = result.meals?.byType.find((t) => t.type === "lunch");
    expect(lunch?.count).toBe(3);
  });

  it("computes activity analytics with total minutes", () => {
    const activities = [
      activity("a1", { y: 2026, mo: 7, d: 23, h: 18 }, 30),
      activity("a2", { y: 2026, mo: 7, d: 24, h: 18 }, 45),
    ];

    const result = computeIntelligenceAnalytics([], [], activities, PERIOD);
    expect(result.activities?.totalCount).toBe(2);
    expect(result.activities?.totalMinutes).toBe(75);
  });

  it("computes data quality", () => {
    const glucose = [
      glucoseReading("g1", 100, { y: 2026, mo: 7, d: 23, h: 8 }),
      glucoseReading("g2", 120, { y: 2026, mo: 7, d: 24, h: 9 }),
    ];

    const result = computeIntelligenceAnalytics(glucose, [], [], PERIOD);
    expect(result.dataQuality.totalRecords).toBe(2);
    expect(result.dataQuality.sufficientForAnalysis).toBe(false);
  });

  it("builds meal-glucose temporal relations", () => {
    const meals = [
      meal("m1", { y: 2026, mo: 7, d: 25, h: 12, min: 30 }),
    ];
    const glucose = [
      // 30min before meal
      glucoseReading("before", 110, { y: 2026, mo: 7, d: 25, h: 12, min: 0 }),
      // 90min after meal
      glucoseReading("after", 143, { y: 2026, mo: 7, d: 25, h: 14, min: 0 }),
    ];

    const result = computeIntelligenceAnalytics(glucose, meals, [], PERIOD);
    const relation = result.mealGlucoseRelations[0];
    expect(relation.mealId).toBe("m1");
    expect(relation.glucoseBefore?.value).toBe(110);
    expect(relation.glucoseAfter?.value).toBe(143);
  });

  it("does not associate unrelated glucose readings", () => {
    const meals = [meal("m1", { y: 2026, mo: 7, d: 25, h: 12, min: 30 })];
    const glucose = [
      // far in the past
      glucoseReading("old", 110, { y: 2026, mo: 7, d: 22, h: 8 }),
    ];

    const result = computeIntelligenceAnalytics(glucose, meals, [], PERIOD);
    const relation = result.mealGlucoseRelations[0];
    expect(relation.glucoseBefore).toBeUndefined();
    expect(relation.glucoseAfter).toBeUndefined();
  });

  it("respects user isolation through scoped input data", () => {
    const glucoseA = [glucoseReading("g1", 110, { y: 2026, mo: 7, d: 23, h: 8 }, "A")];
    const glucoseB = [glucoseReading("g2", 200, { y: 2026, mo: 7, d: 23, h: 9 }, "B")];

    const resultA = computeIntelligenceAnalytics(glucoseA, [], [], PERIOD);
    const resultB = computeIntelligenceAnalytics(glucoseB, [], [], PERIOD);

    expect(resultA.glucose?.stats.average).toBe(110);
    expect(resultB.glucose?.stats.average).toBe(200);
  });
});
