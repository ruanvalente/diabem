import { describe, expect, it } from "vitest";
import { compareGlucosePeriods, compareActivityPeriods } from "./period-comparison";
import { glucoseReading, activity } from "../__fixtures__";

function reading(id: string, value: number, day: number) {
  return glucoseReading(id, value, { y: 2026, mo: 7, d: day, h: 8 });
}

describe("compareGlucosePeriods", () => {
  const current = [reading("g1", 100, 23), reading("g2", 120, 24), reading("g3", 140, 25)];
  const previous = [reading("g4", 200, 17), reading("g5", 220, 18)];

  it("compares averages", () => {
    const result = compareGlucosePeriods(current, previous);
    expect(result.average?.current).toBe(120);
    expect(result.average?.previous).toBe(210);
    expect(result.average?.absoluteDifference).toBe(-90);
    expect(result.average?.percentageDifference).toBeCloseTo(-42.86, 1);
  });

  it("compares counts", () => {
    const result = compareGlucosePeriods(current, previous);
    expect(result.count?.current).toBe(3);
    expect(result.count?.previous).toBe(2);
  });

  it("returns undefined comparisons when data is empty", () => {
    const result = compareGlucosePeriods([], previous);
    expect(result.average).toBeUndefined();
    expect(result.count?.current).toBe(0);
  });
});

describe("compareActivityPeriods", () => {
  it("compares counts and total minutes", () => {
    const current = [
      activity("a1", { y: 2026, mo: 7, d: 23, h: 18 }, 30),
      activity("a2", { y: 2026, mo: 7, d: 24, h: 18 }, 45),
    ];
    const previous = [activity("a3", { y: 2026, mo: 7, d: 18, h: 18 }, 60)];

    const result = compareActivityPeriods(current, previous);
    expect(result.count?.current).toBe(2);
    expect(result.count?.previous).toBe(1);
    expect(result.totalMinutes?.current).toBe(75);
    expect(result.totalMinutes?.previous).toBe(60);
  });
});
