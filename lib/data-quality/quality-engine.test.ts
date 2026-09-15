import { describe, expect, it } from "vitest";
import { assessRecord, assessDataset, levelFromScore } from "./quality-engine";
import type { GlucoseReading, Meal, Activity } from "@/lib/db/types";

function buildGlucose(overrides: Partial<GlucoseReading> = {}): GlucoseReading {
  return {
    id: "g1",
    userId: "u",
    value: 100,
    unit: "mg/dL",
    context: "fasting",
    measuredAt: new Date().toISOString(),
    notes: "Medição matinal",
    provenance: { source: "manual", recordedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "m1",
    userId: "u",
    type: "lunch",
    description: "Almoço",
    consumedAt: new Date().toISOString(),
    provenance: { source: "manual", recordedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    userId: "u",
    type: "walking",
    durationMinutes: 30,
    startedAt: new Date().toISOString(),
    provenance: { source: "manual", recordedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("assessRecord — glucose", () => {
  it("returns high quality for a valid, complete record", () => {
    const result = assessRecord({ kind: "glucose", data: buildGlucose() });
    expect(result.level).toBe("high");
    expect(result.score).toBe(1);
    expect(result.issues).toHaveLength(0);
  });

  it("flags unknown provenance", () => {
    const record = buildGlucose({ provenance: undefined });
    const result = assessRecord({ kind: "glucose", data: record });
    expect(result.level).toBe("medium");
    expect(result.issues.map((i) => i.code)).toContain("unknown_provenance");
  });

  it("flags missing value", () => {
    const record = buildGlucose({ value: undefined as unknown as number });
    const result = assessRecord({ kind: "glucose", data: record });
    expect(result.issues.map((i) => i.code)).toContain("missing_value");
  });

  it("flags future timestamps", () => {
    const record = buildGlucose({
      measuredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const result = assessRecord({ kind: "glucose", data: record });
    expect(result.issues.map((i) => i.code)).toContain("future_timestamp");
  });

  it("flags invalid timestamps", () => {
    const record = buildGlucose({ measuredAt: "not-a-date" });
    const result = assessRecord({ kind: "glucose", data: record });
    expect(result.issues.map((i) => i.code)).toContain("invalid_timestamp");
  });

  it("assigns high quality to imported data with valid provenance", () => {
    const record = buildGlucose({
      provenance: {
        source: "import",
        sourceId: "file-1",
        importedAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
      },
    });
    const result = assessRecord({ kind: "glucose", data: record });
    expect(result.level).toBe("high");
  });

  it("reports missing notes as an info-level issue (incomplete record)", () => {
    const record = buildGlucose({ notes: undefined });
    const result = assessRecord({ kind: "glucose", data: record });
    expect(result.issues.map((i) => i.code)).toContain("missing_notes");
    expect(result.issues.find((i) => i.code === "missing_notes")?.severity).toBe("info");
  });
});

describe("assessRecord — meal", () => {
  it("returns high quality for a valid meal", () => {
    const result = assessRecord({ kind: "meal", data: buildMeal() });
    expect(result.level).toBe("high");
  });

  it("flags missing description", () => {
    const record = buildMeal({ description: "" });
    const result = assessRecord({ kind: "meal", data: record });
    expect(result.issues.map((i) => i.code)).toContain("missing_required_field");
  });
});

describe("assessRecord — activity", () => {
  it("returns high quality for a valid activity", () => {
    const result = assessRecord({ kind: "activity", data: buildActivity() });
    expect(result.level).toBe("high");
  });

  it("flags invalid duration", () => {
    const record = buildActivity({ durationMinutes: 0 });
    const result = assessRecord({ kind: "activity", data: record });
    expect(result.issues.map((i) => i.code)).toContain("missing_value");
  });
});

describe("assessDataset", () => {
  it("assesses every record and dedups issues at dataset level", () => {
    const records = {
      glucose: [buildGlucose(), buildGlucose({ id: "g2", provenance: undefined })],
      meals: [buildMeal()],
      activities: [buildActivity()],
    };
    const results = assessDataset(records);
    expect(results).toHaveLength(4);
  });
});

describe("levelFromScore", () => {
  it("maps scores to quality levels", () => {
    expect(levelFromScore(1)).toBe("high");
    expect(levelFromScore(0.9)).toBe("high");
    expect(levelFromScore(0.7)).toBe("medium");
    expect(levelFromScore(0.5)).toBe("medium");
    expect(levelFromScore(0.3)).toBe("low");
    expect(levelFromScore(0)).toBe("unknown");
  });
});