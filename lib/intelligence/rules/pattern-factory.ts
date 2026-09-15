import type { Pattern, PatternType, PatternSeverity, PatternEvidence } from "../types/rule.types";

export type CreatePatternOptions = {
  title: string;
  explanation: string;
  ruleVersion: string;
  sourceIds?: string[];
  generatedAt?: string;
};

export function createPattern(
  ruleId: string,
  type: PatternType,
  severity: PatternSeverity,
  evidence: PatternEvidence[],
  confidence?: number,
  options?: CreatePatternOptions
): Pattern {
  return {
    id: `pat-${ruleId}`,
    ruleId,
    ruleVersion: options?.ruleVersion ?? "1.0.0",
    type,
    severity,
    confidence,
    title: options?.title ?? `${ruleId} detectado`,
    explanation: options?.explanation ?? "",
    evidence,
    sourceIds: options?.sourceIds ?? [],
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
  };
}