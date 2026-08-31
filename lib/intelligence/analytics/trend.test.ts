import { describe, expect, it } from "vitest";
import { calculateTrend } from "./trend";

function increasing(): number[] {
  return [100, 105, 110, 115, 120, 125];
}

function decreasing(): number[] {
  return [125, 120, 115, 110, 105, 100];
}

function stable(): number[] {
  return [120, 121, 119, 120, 121, 120];
}

describe("calculateTrend", () => {
  it("detects an increasing trend", () => {
    const trend = calculateTrend(increasing());
    expect(trend.direction).toBe("increasing");
  });

  it("detects a decreasing trend", () => {
    const trend = calculateTrend(decreasing());
    expect(trend.direction).toBe("decreasing");
  });

  it("detects a stable trend", () => {
    const trend = calculateTrend(stable());
    expect(trend.direction).toBe("stable");
  });

  it("returns insufficient_data with fewer than 5 points", () => {
    const trend = calculateTrend([100, 110, 120]);
    expect(trend.direction).toBe("insufficient_data");
  });

  it("is deterministic for the same input", () => {
    expect(calculateTrend(increasing())).toEqual(calculateTrend(increasing()));
  });
});
