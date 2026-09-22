import { describe, it, expect } from "vitest";
import { formatActivityDuration } from "./activity-display";

describe("formatActivityDuration", () => {
  it("renders values under one hour as minutes", () => {
    expect(formatActivityDuration(45)).toBe("45 min");
  });

  it("renders exact hours without a minutes remainder", () => {
    expect(formatActivityDuration(60)).toBe("1h");
    expect(formatActivityDuration(120)).toBe("2h");
    expect(formatActivityDuration(1440)).toBe("24h");
  });

  it("renders hours and minutes together", () => {
    expect(formatActivityDuration(90)).toBe("1h 30min");
    expect(formatActivityDuration(125)).toBe("2h 5min");
  });
});
