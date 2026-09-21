import { describe, expect, it } from "vitest";
import type { DataContext } from "../data-context";
import type { DataQuality } from "../types/analytics.types";
import {
  analyzeLocalIntelligence,
  localIntelligenceService,
} from "./local-intelligence.service";
import { LOCAL_INTELLIGENCE_VERSION } from "./intelligence-result";

const PERIOD = {
  start: "2026-09-01T00:00:00.000Z",
  end: "2026-09-07T00:00:00.000Z",
};

function baseContext(): DataContext {
  return {
    contextVersion: 1,
    generatedAt: "2026-09-03T12:00:00.000Z",
    period: PERIOD,
    records: {
      glucose: [
        {
          kind: "glucose",
          id: "g1",
          value: 110,
          context: "fasting",
          measuredAt: "2026-09-02T08:00:00.000Z",
          provenance: { source: "manual", recordedAt: PERIOD.start },
        },
        {
          kind: "glucose",
          id: "g2",
          value: 120,
          context: "after_meal",
          measuredAt: "2026-09-03T13:00:00.000Z",
          provenance: { source: "manual", recordedAt: PERIOD.start },
        },
      ],
      meals: [
        {
          kind: "meal",
          id: "m1",
          type: "lunch",
          description: "Almoço",
          consumedAt: "2026-09-02T12:00:00.000Z",
          provenance: { source: "device", sourceId: "dev-1", recordedAt: PERIOD.start },
        },
        {
          kind: "meal",
          id: "m2",
          type: "breakfast",
          description: "Café da manhã",
          consumedAt: "2026-09-03T08:00:00.000Z",
        },
      ],
      activities: [],
      medications: [],
      notes: [],
    },
  };
}

function contextQuality(level: DataQuality["level"]): DataQuality {
  return {
    totalRecords: 4,
    missingValues: 0,
    duplicatedRecords: 0,
    periodCoverage: 0.5,
    sufficientForAnalysis: true,
    score: 90,
    level,
    issues: [
      {
        code: "missing_notes",
        severity: "info",
        field: "notes",
        message: "sem notas",
      },
    ],
  };
}

describe("localIntelligenceService.analyze", () => {
  it("is deterministic and aggregates record counts by type", async () => {
    const context = baseContext();
    const first = await localIntelligenceService.analyze(context);
    const second = await localIntelligenceService.analyze(context);

    expect(first.summary).toEqual(second.summary);
    expect(first.summary.totalRecords).toBe(4);
    expect(first.summary.availableRecordTypes).toEqual(["glucose", "meals"]);
    expect(first.summary.counts).toEqual({ glucose: 2, meals: 2, activities: 0, medications: 0, notes: 0 });
    expect(first.version).toBe(LOCAL_INTELLIGENCE_VERSION);
  });

  it("computes coverage and lists the days without records", async () => {
    const result = await analyzeLocalIntelligence(baseContext());

    expect(result.coverage.start).toBe(PERIOD.start);
    expect(result.coverage.end).toBe(PERIOD.end);
    expect(result.coverage.totalDays).toBe(6);
    expect(result.coverage.coveredDays).toBe(2);
    expect(result.coverage.limited).toBe(false);
    expect(result.coverage.missingPeriods).toHaveLength(4);
  });

  it("flags very long periods as limited instead of enumerating days", async () => {
    const context = baseContext();
    context.period = {
      start: "2024-01-01T00:00:00.000Z",
      end: "2026-09-07T00:00:00.000Z",
    };

    const result = await analyzeLocalIntelligence(context);

    expect(result.coverage.totalDays).toBeGreaterThan(732);
    expect(result.coverage.limited).toBe(true);
    expect(result.coverage.missingPeriods).toEqual([]);
  });

  it("mirrors the data quality from the context", async () => {
    const context = baseContext();
    context.quality = contextQuality("high");

    const result = await analyzeLocalIntelligence(context);

    expect(result.dataQuality.level).toBe("high");
    expect(result.dataQuality.issueCount).toBe(1);
    expect(result.dataQuality.issueCodes).toEqual(["missing_notes"]);
  });

  it("reports not_requested for absent quality and provenance", async () => {
    const result = await analyzeLocalIntelligence(baseContext());

    expect(result.dataQuality.level).toBe("not_requested");
    expect(result.provenance.notRequested).toBe(true);
    expect(result.provenance.bySource).toEqual({});
  });

  it("aggregates provenance by source including unknown records", async () => {
    const context = baseContext();
    context.provenance = {
      bySource: [
        { source: "manual", count: 2 },
        { source: "device", count: 1 },
      ],
      knownSourceRate: 0.75,
      unknownSourceCount: 1,
      totalRecords: 4,
    };

    const result = await analyzeLocalIntelligence(context);

    expect(result.provenance.notRequested).toBe(false);
    expect(result.provenance.bySource).toEqual({
      manual: 2,
      device: 1,
    });
    expect(result.provenance.knownSourceRate).toBe(0.75);
    expect(result.provenance.unknownSourceCount).toBe(1);
  });

  it("keeps every derived value traceable through explanations", async () => {
    const context = baseContext();
    context.quality = contextQuality("medium");

    const result = await analyzeLocalIntelligence(context);

    const rules = result.explanations.map((e) => e.rule);
    expect(rules).toEqual([
      "records.count",
      "coverage.days",
      "quality.level",
      "provenance.source",
    ]);
    for (const explanation of result.explanations) {
      expect(explanation.description).toBeTruthy();
      expect(explanation.data).toBeInstanceOf(Array);
    }
  });
});