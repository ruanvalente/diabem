import { describe, expect, it } from "vitest";
import { generateInsights } from "./insight-generator";
import type { Pattern } from "../types/rule.types";
import type { AnalysisPeriod } from "../types/analytics.types";

const PERIOD: AnalysisPeriod = {
  start: new Date(2026, 7, 22).toISOString(),
  end: new Date(2026, 7, 29).toISOString(),
};

function pattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: "p1",
    ruleId: "r1",
    type: "insufficient_data",
    severity: "notice",
    evidence: [
      { metric: "total_records", value: 3, comparison: 10, period: PERIOD },
    ],
    ...overrides,
  };
}

describe("generateInsights", () => {
  it("produces an insight from a pattern with title, description and evidence", () => {
    const insights = generateInsights([pattern()]);
    expect(insights).toHaveLength(1);
    const insight = insights[0];
    expect(insight.title).toBeTruthy();
    expect(insight.description).toContain("dados");
    expect(insight.evidence).toHaveLength(1);
    expect(insight.generatedAt).toBeTruthy();
  });

  it("maps pattern type to an observation insight with evidence", () => {
    const insights = generateInsights([
      pattern({ type: "time_concentration" }),
    ]);
    expect(insights[0].type).toBe("observation");
    expect(insights[0].title).toBe("Concentração de registros");
  });

  it("maps insufficient_data to the insufficient_data type", () => {
    const insights = generateInsights([pattern({ type: "insufficient_data" })]);
    expect(insights[0].type).toBe("insufficient_data");
  });

  it("returns an empty list when no patterns are provided", () => {
    expect(generateInsights([])).toEqual([]);
  });

  it("creates an insight even when the pattern has no evidence", () => {
    const insights = generateInsights([pattern({ evidence: [] })]);
    expect(insights).toHaveLength(1);
    expect(insights[0].evidence).toEqual([]);
  });

  it("produces one insight per supported pattern", () => {
    const insights = generateInsights([
      pattern({ type: "time_concentration" }),
      pattern({ type: "average_change" }),
    ]);
    expect(insights).toHaveLength(2);
  });
});
