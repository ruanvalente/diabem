import { describe, expect, it } from "vitest";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import { buildDataContext } from "./context-builder";
import { resolveSelection } from "./context-options";
import { DATA_CONTEXT_VERSION } from "./data-context.types";

const AT = "2026-09-02T08:00:00.000Z";
const PERIOD = {
  start: "2026-09-01T00:00:00.000Z",
  end: "2026-09-07T00:00:00.000Z",
};

function glucose(id: string, value: number): GlucoseReading {
  return {
    id,
    userId: "u",
    value,
    unit: "mg/dL",
    context: "fasting",
    measuredAt: AT,
    provenance: { source: "manual", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function meal(id: string): Meal {
  return {
    id,
    userId: "u",
    type: "lunch",
    description: "Almoço",
    consumedAt: AT,
    provenance: { source: "device", sourceId: "dev-1", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function activity(id: string): Activity {
  return {
    id,
    userId: "u",
    type: "walking",
    durationMinutes: 30,
    startedAt: AT,
    provenance: { source: "system", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function medication(id: string): Medication {
  return {
    id,
    userId: "u",
    name: "Metformina",
    dosage: "500",
    unit: "mg",
    medicatedAt: AT,
    provenance: { source: "manual", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function note(id: string): Note {
  return {
    id,
    userId: "u",
    content: "texto sensível",
    provenance: { source: "speech", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function sources() {
  return {
    glucose: [glucose("g1", 100), glucose("g2", 120)],
    meals: [meal("m1")],
    activities: [activity("a1")],
    medications: [medication("med1")],
    notes: [note("n1")],
  };
}

describe("buildDataContext", () => {
  it("builds a versioned context with normalized records and provenance", () => {
    const context = buildDataContext({
      period: PERIOD,
      selection: resolveSelection(),
      sources: sources(),
    });

    expect(context.contextVersion).toBe(DATA_CONTEXT_VERSION);
    expect(new Date(context.generatedAt).getTime()).not.toBeNaN();
    expect(context.period).toEqual(PERIOD);

    expect(context.records.glucose).toHaveLength(2);
    expect(context.records.glucose[0]).not.toHaveProperty("userId");
    expect(context.records.meals).toHaveLength(1);
    expect(context.records.activities).toHaveLength(1);
    expect(context.records.medications).toHaveLength(1);
    expect(context.records.notes).toHaveLength(0);

    expect(context.provenance?.totalRecords).toBe(5);
    expect(context.provenance?.bySource).toEqual([
      { source: "manual", count: 3 },
      { source: "device", count: 1 },
      { source: "system", count: 1 },
    ]);

    expect(context.statistics?.glucose?.stats.average).toBe(110);
    expect(context.insights).toBeInstanceOf(Array);
    expect(context.quality?.level).toBeDefined();
  });

  it("omits derived sections that were not requested", () => {
    const context = buildDataContext({
      period: PERIOD,
      selection: resolveSelection({
        statistics: false,
        insights: false,
        quality: false,
        provenance: false,
        notes: true,
      }),
      sources: sources(),
    });

    expect(context.records.notes).toHaveLength(1);
    expect(context.statistics).toBeUndefined();
    expect(context.insights).toBeUndefined();
    expect(context.quality).toBeUndefined();
    expect(context.provenance).toBeUndefined();
  });

  it("combines provenance only over the selected record kinds", () => {
    const context = buildDataContext({
      period: PERIOD,
      selection: resolveSelection({
        glucose: false,
        meals: false,
        activities: false,
        medications: false,
        notes: true,
      }),
      sources: sources(),
    });

    expect(context.records.notes).toHaveLength(1);
    expect(context.provenance?.totalRecords).toBe(1);
    expect(context.provenance?.bySource).toEqual([
      { source: "speech", count: 1 },
    ]);
  });

  it("skips analytics when only non-analytics record kinds are selected", () => {
    const context = buildDataContext({
      period: PERIOD,
      selection: resolveSelection({
        glucose: false,
        meals: false,
        activities: false,
        medications: true,
        statistics: true,
      }),
      sources: sources(),
    });

    expect(context.records.medications).toHaveLength(1);
    expect(context.statistics).toBeUndefined();
    expect(context.quality).toBeUndefined();
  });

  it("normalizes only the record kinds that were selected", () => {
    const context = buildDataContext({
      period: PERIOD,
      selection: resolveSelection({
        glucose: true,
        meals: false,
        activities: false,
        medications: false,
        notes: false,
      }),
      sources: sources(),
    });

    expect(context.records.glucose).toHaveLength(2);
    expect(context.records.meals).toEqual([]);
    expect(context.records.activities).toEqual([]);
    expect(context.records.medications).toEqual([]);
  });
});