import { describe, it, expect } from "vitest";

import { resolveWeekdayPreset } from "./notification-weekday-preset";

describe("resolveWeekdayPreset", () => {
  it("recognizes the supported presets", () => {
    expect(
      resolveWeekdayPreset([
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ]),
    ).toBe("everyDay");
    expect(
      resolveWeekdayPreset(["monday", "tuesday", "wednesday", "thursday", "friday"]),
    ).toBe("weekdays");
    expect(resolveWeekdayPreset(["saturday", "sunday"])).toBe("weekend");
  });

  it("falls back to a custom recurrence", () => {
    expect(resolveWeekdayPreset(["monday", "friday"])).toBe("custom");
    expect(resolveWeekdayPreset([])).toBe("custom");
  });
});
