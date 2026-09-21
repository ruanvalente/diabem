import { describe, expect, it } from "vitest";
import {
  resolveSelection,
  shouldComputeAnalytics,
  validateDataContextOptions,
  validateDataContextPeriod,
} from "./context-options";

const VALID_PERIOD = {
  start: "2026-09-01T00:00:00.000Z",
  end: "2026-09-07T00:00:00.000Z",
};

describe("validateDataContextPeriod", () => {
  it("accepts a valid period and normalizes to ISO", () => {
    const result = validateDataContextPeriod({ start: "2026-09-01", end: "2026-09-07" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.period.start).toBe(
        new Date("2026-09-01").toISOString()
      );
    }
  });

  it("rejects missing bounds", () => {
    const result = validateDataContextPeriod({ start: "", end: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid start date", () => {
    const result = validateDataContextPeriod({ start: "nope", end: "2026-09-07" });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid end date", () => {
    const result = validateDataContextPeriod({ start: "2026-09-01", end: "later" });
    expect(result.ok).toBe(false);
  });

  it("rejects an inverted period", () => {
    const result = validateDataContextPeriod({
      start: VALID_PERIOD.end,
      end: VALID_PERIOD.start,
    });
    expect(result.ok).toBe(false);
  });

  it("accepts an equal start and end", () => {
    const result = validateDataContextPeriod({
      start: VALID_PERIOD.start,
      end: VALID_PERIOD.start,
    });
    expect(result.ok).toBe(true);
  });
});

describe("validateDataContextOptions", () => {
  it("rejects a missing userId", () => {
    expect(
      validateDataContextOptions({ userId: "", period: VALID_PERIOD }).ok
    ).toBe(false);
  });

  it("rejects a blank userId", () => {
    expect(
      validateDataContextOptions({ userId: "   ", period: VALID_PERIOD }).ok
    ).toBe(false);
  });

  it("accepts a valid user with a valid period", () => {
    expect(
      validateDataContextOptions({ userId: "u1", period: VALID_PERIOD }).ok
    ).toBe(true);
  });
});

describe("resolveSelection", () => {
  it("defaults to all record types except notes", () => {
    const selection = resolveSelection();
    expect(selection.recordKinds).toEqual([
      "glucose",
      "meals",
      "activities",
      "medications",
    ]);
    expect(selection.statistics).toBe(true);
    expect(selection.insights).toBe(true);
    expect(selection.quality).toBe(true);
    expect(selection.provenance).toBe(true);
  });

  it("merges user flags over the defaults", () => {
    const selection = resolveSelection({
      glucose: false,
      notes: true,
      statistics: false,
    });
    expect(selection.recordKinds).toContain("notes");
    expect(selection.recordKinds).not.toContain("glucose");
    expect(selection.statistics).toBe(false);
    expect(selection.insights).toBe(true);
  });
});

describe("shouldComputeAnalytics", () => {
  it("is false when no derived section is requested", () => {
    const selection = resolveSelection({
      statistics: false,
      insights: false,
      quality: false,
    });
    expect(shouldComputeAnalytics(selection)).toBe(false);
  });

  it("is false when only non-analytics record kinds are present", () => {
    const selection = resolveSelection({
      glucose: false,
      meals: false,
      activities: false,
      statistics: true,
    });
    expect(shouldComputeAnalytics(selection)).toBe(false);
  });

  it("is true when analytics and an analytics record kind are requested", () => {
    const selection = resolveSelection({ glucose: true, statistics: true });
    expect(shouldComputeAnalytics(selection)).toBe(true);
  });
});