import { describe, expect, it } from "vitest";
import {
  calculateAverage,
  calculateCount,
  calculateMax,
  calculateMedian,
  calculateMin,
  calculateStandardDeviation,
  calculateCoefficientOfVariation,
  calculateBasicStats,
} from "./statistics";

describe("calculateAverage", () => {
  it("returns the arithmetic average rounded to 2 decimals", () => {
    expect(calculateAverage([100, 120, 140])).toBe(120);
    expect(calculateAverage([10, 20])).toBe(15);
  });

  it("returns undefined for an empty array", () => {
    expect(calculateAverage([])).toBeUndefined();
  });
});

describe("calculateMedian", () => {
  it("returns the middle value for an odd-length array", () => {
    expect(calculateMedian([100, 120, 140])).toBe(120);
  });

  it("returns the average of the two middle values for even length", () => {
    expect(calculateMedian([100, 120, 140, 160])).toBe(130);
  });

  it("returns undefined for an empty array", () => {
    expect(calculateMedian([])).toBeUndefined();
  });
});

describe("calculateMin", () => {
  it("returns the minimum", () => {
    expect(calculateMin([100, 120, 140])).toBe(100);
  });

  it("returns undefined for an empty array", () => {
    expect(calculateMin([])).toBeUndefined();
  });
});

describe("calculateMax", () => {
  it("returns the maximum", () => {
    expect(calculateMax([100, 120, 140])).toBe(140);
  });

  it("returns undefined for an empty array", () => {
    expect(calculateMax([])).toBeUndefined();
  });
});

describe("calculateStandardDeviation", () => {
  it("computes the population standard deviation", () => {
    const sd = calculateStandardDeviation([100, 120, 140]);
    expect(sd).toBeCloseTo(16.33, 1);
  });

  it("returns undefined for fewer than 2 values", () => {
    expect(calculateStandardDeviation([])).toBeUndefined();
    expect(calculateStandardDeviation([100])).toBeUndefined();
  });

  it("returns 0 for identical values", () => {
    expect(calculateStandardDeviation([120, 120, 120])).toBe(0);
  });
});

describe("calculateCoefficientOfVariation", () => {
  it("returns the ratio of stddev to mean as a percentage", () => {
    const cv = calculateCoefficientOfVariation([100, 120, 140]);
    expect(cv).toBeCloseTo(13.61, 1);
  });

  it("returns undefined for insufficient data or zero mean", () => {
    expect(calculateCoefficientOfVariation([])).toBeUndefined();
    expect(calculateCoefficientOfVariation([0, 0])).toBeUndefined();
  });
});

describe("calculateBasicStats", () => {
  it("aggregates all stats", () => {
    const stats = calculateBasicStats([100, 120, 140]);
    expect(stats.count).toBe(3);
    expect(stats.average).toBe(120);
    expect(stats.median).toBe(120);
    expect(stats.minimum).toBe(100);
    expect(stats.maximum).toBe(140);
    expect(stats.standardDeviation).toBeCloseTo(16.33, 1);
  });

  it("zeros count for no data", () => {
    expect(calculateCount([])).toBe(0);
  });
});
