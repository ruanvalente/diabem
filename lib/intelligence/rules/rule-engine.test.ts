import { describe, expect, it } from "vitest";
import { evaluateAllRules } from "./rule-engine";
import { insufficientDataRule } from "./insufficient-data.rule";
import { timeConcentrationRule } from "./time-concentration.rule";
import { averageChangeRule } from "./average-change.rule";
import { mealGlucoseRelationRule } from "./meal-glucose-relation.rule";
import { activityGlucoseRelationRule } from "./activity-glucose-relation.rule";
import { computeIntelligenceAnalytics } from "../analytics/analytics-engine";
import { compareGlucosePeriods } from "../analytics/period-comparison";
import { glucoseReading, meal, activity } from "../__fixtures__";
import type { AnalysisPeriod } from "../types/analytics.types";
import type { RuleContext } from "../types/rule.types";

const PERIOD: AnalysisPeriod = {
  start: new Date(2026, 7, 22).toISOString(),
  end: new Date(2026, 7, 29).toISOString(),
};

function buildContext(input: {
  glucose?: ReturnType<typeof glucoseReading>[];
  meals?: ReturnType<typeof meal>[];
  activities?: ReturnType<typeof activity>[];
  previousGlucose?: ReturnType<typeof glucoseReading>[];
}): RuleContext {
  const analytics = computeIntelligenceAnalytics(
    input.glucose ?? [],
    input.meals ?? [],
    input.activities ?? [],
    PERIOD
  );
  analytics.comparisons = compareGlucosePeriods(
    input.glucose ?? [],
    input.previousGlucose ?? []
  );
  return {
    period: PERIOD,
    analytics,
    dataQuality: analytics.dataQuality,
  };
}

function manyGlucose(count: number, value = 120): ReturnType<typeof glucoseReading>[] {
  const readings = [];
  for (let i = 0; i < count; i++) {
    const day = (i % 7) + 22;
    readings.push(
      glucoseReading(`g${i}`, value, { y: 2026, mo: 7, d: day, h: 9 })
    );
  }
  return readings;
}

describe("insufficientDataRule", () => {
  it("returns insufficient_data when total records is low", () => {
    const context = buildContext({ glucose: manyGlucose(2) });
    const result = insufficientDataRule.evaluate(context);
    expect(result?.patterns[0].type).toBe("insufficient_data");
  });

  it("returns nothing when data is sufficient", () => {
    const context = buildContext({
      glucose: manyGlucose(10),
      meals: [meal("m1", { y: 2026, mo: 7, d: 23, h: 12 })],
    });
    expect(insufficientDataRule.evaluate(context)).toBeNull();
  });
});

describe("timeConcentrationRule", () => {
  it("detects concentration in a morning slot", () => {
    const context = buildContext({ glucose: manyGlucose(10) });
    const result = timeConcentrationRule.evaluate(context);
    expect(result?.patterns[0].type).toBe("time_concentration");
  });

  it("ignores when records are spread evenly", () => {
    const readings = [
      glucoseReading("g1", 120, { y: 2026, mo: 7, d: 23, h: 8 }),
      glucoseReading("g2", 120, { y: 2026, mo: 7, d: 24, h: 13 }),
      glucoseReading("g3", 120, { y: 2026, mo: 7, d: 25, h: 19 }),
      glucoseReading("g4", 120, { y: 2026, mo: 7, d: 26, h: 2 }),
      glucoseReading("g5", 120, { y: 2026, mo: 7, d: 27, h: 9 }),
    ];
    const context = buildContext({ glucose: readings });
    expect(timeConcentrationRule.evaluate(context)).toBeNull();
  });

  it("ignores when there are too few records", () => {
    const context = buildContext({ glucose: manyGlucose(2) });
    expect(timeConcentrationRule.evaluate(context)).toBeNull();
  });
});

describe("averageChangeRule", () => {
  it("detects a significant average change", () => {
    const context = buildContext({
      glucose: manyGlucose(10, 150),
      previousGlucose: manyGlucose(10, 100),
    });
    const result = averageChangeRule.evaluate(context);
    expect(result?.patterns[0].type).toBe("average_change");
  });

  it("ignores a small average change", () => {
    const context = buildContext({
      glucose: manyGlucose(10, 120),
      previousGlucose: manyGlucose(10, 118),
    });
    expect(averageChangeRule.evaluate(context)).toBeNull();
  });
});

describe("mealGlucoseRelationRule", () => {
  it("detects available meal-glucose data", () => {
    const meals = [
      meal("m1", { y: 2026, mo: 7, d: 23, h: 12, min: 30 }),
      meal("m2", { y: 2026, mo: 7, d: 24, h: 12, min: 30 }),
      meal("m3", { y: 2026, mo: 7, d: 25, h: 12, min: 30 }),
    ];
    const glucose = [
      glucoseReading("g1", 110, { y: 2026, mo: 7, d: 23, h: 12 }),
      glucoseReading("g2", 110, { y: 2026, mo: 7, d: 24, h: 12 }),
      glucoseReading("g3", 110, { y: 2026, mo: 7, d: 25, h: 12 }),
    ];
    const context = buildContext({ glucose, meals });
    const result = mealGlucoseRelationRule.evaluate(context);
    expect(result?.patterns[0].type).toBe("meal_glucose_data_available");
  });

  it("ignores when there are no relations", () => {
    const context = buildContext({ glucose: manyGlucose(10), meals: [] });
    expect(mealGlucoseRelationRule.evaluate(context)).toBeNull();
  });
});

describe("activityGlucoseRelationRule", () => {
  it("detects available activity-glucose data", () => {
    const activities = [
      activity("a1", { y: 2026, mo: 7, d: 23, h: 18 }, 30),
      activity("a2", { y: 2026, mo: 7, d: 24, h: 18 }, 30),
      activity("a3", { y: 2026, mo: 7, d: 25, h: 18 }, 30),
    ];
    const glucose = [
      glucoseReading("g1", 110, { y: 2026, mo: 7, d: 23, h: 19 }),
      glucoseReading("g2", 110, { y: 2026, mo: 7, d: 24, h: 19 }),
      glucoseReading("g3", 110, { y: 2026, mo: 7, d: 25, h: 19 }),
    ];
    const context = buildContext({ glucose, activities });
    const result = activityGlucoseRelationRule.evaluate(context);
    expect(result?.patterns[0].type).toBe("activity_glucose_data_available");
  });

  it("ignores when there are no relations", () => {
    const context = buildContext({ glucose: manyGlucose(10), activities: [] });
    expect(activityGlucoseRelationRule.evaluate(context)).toBeNull();
  });
});

describe("evaluateAllRules", () => {
  it("returns insufficient_data pattern for little data", () => {
    const context = buildContext({ glucose: manyGlucose(1) });
    const patterns = evaluateAllRules(context);
    expect(patterns.some((p) => p.type === "insufficient_data")).toBe(true);
  });

  it("all generated patterns carry evidence", () => {
    const context = buildContext({
      glucose: manyGlucose(30, 130),
    });
    const patterns = evaluateAllRules(context);
    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      expect(pattern.evidence).toBeInstanceOf(Array);
    }
  });
});
