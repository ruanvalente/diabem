import { describe, expect, it } from "vitest";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import {
  normalizeActivityRecord,
  normalizeGlucoseRecord,
  normalizeMealRecord,
  normalizeMedicationRecord,
  normalizeNoteRecord,
  summarizeProvenance,
} from "./context-normalizer";

const AT = "2026-09-02T08:00:00.000Z";

function glucose(): GlucoseReading {
  return {
    id: "g1",
    userId: "u",
    value: 110,
    unit: "mg/dL",
    context: "fasting",
    measuredAt: AT,
    sourceKey: "dev|2026-09-02T08:00:00.000Z|fasting|110",
    notes: "após despertar",
    provenance: { source: "manual", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function meal(): Meal {
  return {
    id: "m1",
    userId: "u",
    type: "lunch",
    description: "Almoço leve",
    consumedAt: AT,
    provenance: { source: "device", sourceId: "dev-1", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function activity(): Activity {
  return {
    id: "a1",
    userId: "u",
    type: "running",
    durationMinutes: 45,
    startedAt: AT,
    notes: "manhã",
    provenance: { source: "system", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function medication(): Medication {
  return {
    id: "med1",
    userId: "u",
    name: "Metformina",
    dosage: "500",
    unit: "mg",
    frequency: "2x ao dia",
    medicatedAt: AT,
    provenance: { source: "manual", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

function note(): Note {
  return {
    id: "n1",
    userId: "u",
    content: "texto sensível",
    provenance: { source: "speech", recordedAt: AT },
    createdAt: AT,
    updatedAt: AT,
  };
}

describe("normalizers", () => {
  it("reduces each record to its context fields, never leaking internals", () => {
    expect(normalizeGlucoseRecord(glucose())).toEqual({
      kind: "glucose",
      id: "g1",
      value: 110,
      context: "fasting",
      measuredAt: AT,
      notes: "após despertar",
      provenance: { source: "manual", recordedAt: AT },
    });
    expect(normalizeMealRecord(meal())).toEqual({
      kind: "meal",
      id: "m1",
      type: "lunch",
      description: "Almoço leve",
      consumedAt: AT,
      notes: undefined,
      provenance: { source: "device", sourceId: "dev-1", recordedAt: AT },
    });
    expect(normalizeActivityRecord(activity())).toMatchObject({
      kind: "activity",
      id: "a1",
      type: "running",
      durationMinutes: 45,
      startedAt: AT,
    });
    expect(normalizeMedicationRecord(medication())).toEqual({
      kind: "medication",
      id: "med1",
      name: "Metformina",
      dosage: "500",
      unit: "mg",
      frequency: "2x ao dia",
      route: undefined,
      medicatedAt: AT,
      provenance: { source: "manual", recordedAt: AT },
    });
    expect(normalizeNoteRecord(note())).toMatchObject({
      kind: "note",
      id: "n1",
      content: "texto sensível",
      createdAt: AT,
    });
  });

  it("does not expose userId or internal storage fields", () => {
    const output = normalizeGlucoseRecord(glucose());
    expect(JSON.stringify(output)).not.toContain("userId");
    expect(output).not.toHaveProperty("sourceKey");
    expect(output).not.toHaveProperty("createdAt");
    expect(output).not.toHaveProperty("updatedAt");
  });
});

describe("summarizeProvenance", () => {
  it("counts records by source and unknown ones", () => {
    const summary = summarizeProvenance([
      glucose(),
      meal(),
      note(),
      { provenance: undefined },
    ]);

    expect(summary.bySource.find((s) => s.source === "manual")?.count).toBe(1);
    expect(summary.bySource.find((s) => s.source === "device")?.count).toBe(1);
    expect(summary.bySource.find((s) => s.source === "speech")?.count).toBe(1);
    expect(summary.unknownSourceCount).toBe(1);
    expect(summary.totalRecords).toBe(4);
    expect(summary.knownSourceRate).toBe(0.75);
  });

  it("returns a zeroed summary for empty input", () => {
    const summary = summarizeProvenance([]);
    expect(summary.totalRecords).toBe(0);
    expect(summary.unknownSourceCount).toBe(0);
    expect(summary.knownSourceRate).toBe(0);
    expect(summary.bySource).toEqual([]);
  });
});