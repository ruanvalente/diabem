import type { AnalysisPeriod, IntelligenceAnalytics, DataQuality } from "./analytics.types";

export type PatternType =
  | "time_concentration"
  | "average_change"
  | "increased_variability"
  | "meal_glucose_data_available"
  | "activity_glucose_data_available"
  | "insufficient_data"
  | "trend_detected";

export type PatternSeverity = "info" | "notice";

export type PatternEvidence = {
  metric: string;
  value: number;
  comparison?: number;
  period: AnalysisPeriod;
};

export type Pattern = {
  id: string;
  ruleId: string;
  type: PatternType;
  severity: PatternSeverity;
  confidence?: number;
  evidence: PatternEvidence[];
};

export type RuleResult = {
  patterns: Pattern[];
};

export type RuleContext = {
  period: AnalysisPeriod;
  analytics: IntelligenceAnalytics;
  dataQuality: DataQuality;
};

export interface IntelligenceRule {
  id: string;
  version: string;
  description: string;
  evaluate(context: RuleContext): RuleResult | null;
}
