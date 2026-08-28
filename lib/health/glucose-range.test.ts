import { describe, expect, it } from "vitest";
import { getGlucoseRange, getGlucoseRangeInfo } from "./glucose-range";

describe("getGlucoseRange", () => {
  it("classifies boundary values", () => {
    expect(getGlucoseRange(69)).toBe("low");
    expect(getGlucoseRange(70)).toBe("in_range");
    expect(getGlucoseRange(140)).toBe("in_range");
    expect(getGlucoseRange(141)).toBe("high");
    expect(getGlucoseRange(180)).toBe("high");
    expect(getGlucoseRange(181)).toBe("very_high");
  });
});

describe("getGlucoseRangeInfo", () => {
  it("always carries a human label and badge variant", () => {
    for (const value of [55, 100, 160, 320]) {
      const info = getGlucoseRangeInfo(value);
      expect(info.label.length).toBeGreaterThan(0);
      expect(["default", "secondary", "destructive"]).toContain(
        info.badgeVariant
      );
    }
  });
});