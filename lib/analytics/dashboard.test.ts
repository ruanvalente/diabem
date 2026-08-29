import { describe, expect, it } from "vitest";
import type { Activity, GlucoseReading, Meal, Note } from "@/lib/db/types";
import { buildDashboardSummary, getRecentRecords } from "./dashboard";

function glucose(
  value: number,
  local: { y: number; mo: number; d: number; h?: number },
): GlucoseReading {
  const measuredAt = new Date(
    local.y,
    local.mo,
    local.d,
    local.h ?? 8,
  ).toISOString();
  return {
    id: `g-${value}-${measuredAt}`,
    userId: "user-a",
    value,
    unit: "mg/dL",
    context: "fasting",
    measuredAt,
    createdAt: measuredAt,
    updatedAt: measuredAt,
  };
}

function activity(
  startedAt: string,
  durationMinutes: number,
  id = "a-1",
): Activity {
  return {
    id,
    userId: "user-a",
    type: "walking",
    durationMinutes,
    startedAt,
    notes: undefined,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

function meal(consumedAt: string, id = "m-1"): Meal {
  return {
    id,
    userId: "user-a",
    type: "lunch",
    description: "Almoço",
    consumedAt,
    notes: undefined,
    createdAt: consumedAt,
    updatedAt: consumedAt,
  };
}

function note(createdAt: string, id = "n-1"): Note {
  return {
    id,
    userId: "user-a",
    content: "Uma observação",
    createdAt,
    updatedAt: createdAt,
  };
}

describe("buildDashboardSummary", () => {
  it("counts records and computes activity minutes", () => {
    const at = (h: number) => new Date(2026, 7, 28, h).toISOString();

    const summary = buildDashboardSummary(
      {
        glucose: [
          glucose(143, { y: 2026, mo: 7, d: 28, h: 20 }),
          glucose(128, { y: 2026, mo: 7, d: 28, h: 8 }),
        ],
        meals: [meal(at(12))],
        activities: [activity(at(7), 30), activity(at(18), 15)],
        notes: [note(at(21))],
      },
      { from: at(0), to: at(0) },
    );

    expect(summary.glucose.count).toBe(2);
    expect(summary.glucose.latest?.value).toBe(143);
    expect(summary.meals.count).toBe(1);
    expect(summary.activities.count).toBe(2);
    expect(summary.activities.totalMinutes).toBe(45);
    expect(summary.notes.count).toBe(1);
    expect(summary.totalRecords).toBe(6);
    expect(summary.period.start).toBe(at(0));
  });

  it("handles a brand-new account with no records", () => {
    const summary = buildDashboardSummary({
      glucose: [],
      meals: [],
      activities: [],
      notes: [],
    });

    expect(summary.totalRecords).toBe(0);
    expect(summary.glucose.latest).toBeUndefined();
    expect(summary.activities.totalMinutes).toBe(0);
  });

  it("picks the newest glucose reading as latest", () => {
    const summary = buildDashboardSummary({
      glucose: [
        glucose(140, { y: 2026, mo: 7, d: 28, h: 9 }),
        glucose(100, { y: 2026, mo: 7, d: 27, h: 9 }),
      ],
      meals: [],
      activities: [],
      notes: [],
    });

    expect(summary.glucose.latest).toBeDefined();
    expect(summary.glucose.latest!.value).toBe(140);
  });
});

describe("getRecentRecords", () => {
  it("caps each type at the requested limit", () => {
    const records = {
      glucose: [
        glucose(1, { y: 2026, mo: 7, d: 28 }),
        glucose(2, { y: 2026, mo: 7, d: 28 }),
      ],
      meals: [meal("2026-08-28T00:00:00.000Z")],
      activities: [activity("2026-08-28T00:00:00.000Z", 10)],
      notes: [note("2026-08-28T00:00:00.000Z")],
    };

    const recent = getRecentRecords(records, 1);
    expect(recent.glucose).toHaveLength(1);
    expect(recent.meals).toHaveLength(1);
    expect(recent.activities).toHaveLength(1);
    expect(recent.notes).toHaveLength(1);
    expect(recent.glucose[0].value).toBe(1);
  });
});
