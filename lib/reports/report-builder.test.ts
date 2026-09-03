import { describe, expect, it } from "vitest";
import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import {
  buildReportSummary,
  buildReportTimeline,
  buildCsvRows,
  resolveIncludedKinds,
  buildReportData,
  serializeReportJson,
  insightStrings,
  fileTimestamp,
} from "./report-builder";

function glucose(overrides: Partial<GlucoseReading> = {}): GlucoseReading {
  return {
    id: "g1",
    userId: "u1",
    value: 120,
    unit: "mg/dL",
    context: "fasting",
    measuredAt: "2026-09-01T08:00:00.000Z",
    createdAt: "2026-09-01T08:00:01.000Z",
    updatedAt: "2026-09-01T08:00:01.000Z",
    ...overrides,
  };
}

function meal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "m1",
    userId: "u1",
    type: "breakfast",
    description: "Pão e café",
    consumedAt: "2026-09-01T09:00:00.000Z",
    createdAt: "2026-09-01T09:00:01.000Z",
    updatedAt: "2026-09-01T09:00:01.000Z",
    ...overrides,
  };
}

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    userId: "u1",
    type: "walking",
    durationMinutes: 30,
    startedAt: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-09-01T10:00:01.000Z",
    updatedAt: "2026-09-01T10:00:01.000Z",
    ...overrides,
  };
}

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "n1",
    userId: "u1",
    content: "Senti-me bem",
    createdAt: "2026-09-01T11:00:00.000Z",
    updatedAt: "2026-09-01T11:00:00.000Z",
    ...overrides,
  };
}

describe("buildReportSummary", () => {
  it("computes counts, average and min/max from records", () => {
    const summary = buildReportSummary(
      [glucose({ value: 100 }), glucose({ value: 140, id: "g2" })],
      [meal(), meal({ id: "m2", type: "lunch" })],
      [activity(), activity({ id: "a2", durationMinutes: 15 })],
      [note()],
    );

    expect(summary.glucoseCount).toBe(2);
    expect(summary.glucoseAverage).toBe(120);
    expect(summary.glucoseMinimum).toBe(100);
    expect(summary.glucoseMaximum).toBe(140);
    expect(summary.mealCount).toBe(2);
    expect(summary.activityCount).toBe(2);
    expect(summary.activityTotalMinutes).toBe(45);
    expect(summary.noteCount).toBe(1);
    expect(summary.totalRecords).toBe(7);
  });

  it("returns nulls for optional glucose stats when no glucose records", () => {
    const summary = buildReportSummary([], [meal()], [], []);
    expect(summary.glucoseCount).toBe(0);
    expect(summary.glucoseAverage).toBeNull();
    expect(summary.glucoseMinimum).toBeNull();
    expect(summary.glucoseMaximum).toBeNull();
  });
});

describe("buildReportTimeline", () => {
  it("sorts entries by time descending and includes all kinds", () => {
    const timeline = buildReportTimeline(
      [glucose({ measuredAt: "2026-09-01T08:00:00.000Z" })],
      [meal({ consumedAt: "2026-09-01T09:00:00.000Z" })],
      [activity({ startedAt: "2026-09-01T10:00:00.000Z" })],
      [note({ createdAt: "2026-09-01T11:00:00.000Z" })],
    );

    expect(timeline).toHaveLength(4);
    expect(timeline[0].type).toBe("note");
    expect(timeline[3].type).toBe("glucose");
    expect(timeline.every((e) => e.detail.length > 0)).toBe(true);
  });
});

describe("resolveIncludedKinds", () => {
  it("maps categories to record kinds", () => {
    expect(resolveIncludedKinds(["glucose", "meals"])).toEqual({
      glucose: true,
      meals: true,
      activity: false,
      notes: false,
    });
  });
});

describe("buildCsvRows", () => {
  it("emits only the selected categories with headers", () => {
    const rows = buildCsvRows(
      {
        glucose: [glucose({ value: 110 })],
        meals: [meal()],
        activities: [activity()],
        notes: [note()],
      },
      ["glucose", "notes"],
    );

    expect(rows).toContain("glicemia");
    expect(rows).toContain("observação");
    expect(rows).not.toContain("refeição\n");
    expect(rows.split("\n").length).toBe(4);
  });

  it("escapes commas and quotes in CSV fields", () => {
    const rows = buildCsvRows(
      { glucose: [], meals: [meal({ description: 'pão, "integral"' })], activities: [], notes: [] },
      ["meals"],
    );
    expect(rows).toContain('"pão, ""integral"""');
  });
});

describe("buildReportData", () => {
  it("produces a serializable report with summary, timeline and insights", () => {
    const data = buildReportData({
      records: {
        glucose: [glucose()],
        meals: [meal()],
        activities: [],
        notes: [],
      },
      period: { start: "2026-09-01T00:00:00.000Z", end: "2026-09-02T00:00:00.000Z" },
      categories: ["glucose", "meals"],
      insights: ["Observação 1"],
      generatedAt: "2026-09-02T12:00:00.000Z",
    });

    expect(data.period.start).toBe("2026-09-01T00:00:00.000Z");
    expect(data.summary.glucoseCount).toBe(1);
    expect(data.insights).toContain("Observação 1");
    expect(data.timeline).toHaveLength(2);
    expect(() => JSON.parse(serializeReportJson(data))).not.toThrow();
  });
});

describe("insightStrings", () => {
  it("joins title and description into a flat string", () => {
    const strings = insightStrings([
      {
        id: "i1",
        type: "observation",
        priority: "low",
        title: "Título",
        description: "Descrição",
        evidence: [],
        generatedAt: "x",
      },
    ]);
    expect(strings).toEqual(["Título: Descrição"]);
  });
});

describe("fileTimestamp", () => {
  it("formats a local Date into a compact stamp", () => {
    expect(fileTimestamp(new Date(2026, 8, 2, 9, 5))).toBe("20260902-0905");
  });
});
