import type { Pattern, PatternType, PatternSeverity, PatternEvidence } from "../types/rule.types";

export function createPattern(
  ruleId: string,
  type: PatternType,
  severity: PatternSeverity,
  evidence: PatternEvidence[],
  confidence?: number
): Pattern {
  return {
    id: `pat-${ruleId}`,
    ruleId,
    type,
    severity,
    confidence,
    evidence,
  };
}
