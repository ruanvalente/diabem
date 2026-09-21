import { describe, expect, it } from "vitest";
import { buildDataContext } from "./context-builder";
import { resolveSelection } from "./context-options";
import type {
  Activity,
  GlucoseReading,
  Meal,
} from "@/lib/db/types";

const AT = "2026-09-02T08:00:00.000Z";
const PERIOD = {
  start: "2026-09-01T00:00:00.000Z",
  end: "2026-09-07T00:00:00.000Z",
};

function glucose(id: string): GlucoseReading {
  return {
    id,
    userId: "u",
    value: 100 + Number(id.replace(/\D/g, "")) % 80,
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
    createdAt: AT,
    updatedAt: AT,
  };
}

/**
 * Performance guard, not a benchmark: a large context must assemble within a
 * generous budget. Keeps the data-context layer from accidentally becoming
 * quadratic on typical volumes.
 */
describe("context performance", () => {
  it("builds a ~2k record context within a generous time budget", () => {
    const sources = {
      glucose: Array.from({ length: 1000 }, (_, i) => glucose(`g${i}`)),
      meals: Array.from({ length: 500 }, (_, i) => meal(`m${i}`)),
      activities: Array.from({ length: 500 }, (_, i) => activity(`a${i}`)),
      medications: [],
      notes: [],
    };

    const startedAt = performance.now();
    const context = buildDataContext({
      period: PERIOD,
      selection: resolveSelection(),
      sources,
    });
    const elapsedMs = performance.now() - startedAt;

    expect(context.records.glucose).toHaveLength(1000);
    expect(context.records.meals).toHaveLength(500);
    expect(context.records.activities).toHaveLength(500);
    expect(context.provenance?.totalRecords).toBe(2000);
    expect(context.provenance?.unknownSourceCount).toBe(500);
    expect(elapsedMs).toBeLessThan(2000);
  });
});