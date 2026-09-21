import type { DataContextPeriod } from "../data-context";
import type { DataRecordKind } from "../data-context";
import type { DataQualityLevel } from "@/lib/data-quality/types";

/**
 * Version of the `LocalIntelligenceResult` contract. Bump on structural
 * changes so future consumers can adapt.
 */
export const LOCAL_INTELLIGENCE_VERSION = 1;

/**
 * Traceability unit: every result maps back to a rule and the data it used.
 * This keeps the deterministic analysis explainable (result → rule → data).
 */
export type LocalIntelligenceExplanation = {
  rule: string;
  description: string;
  data: string[];
};

export type LocalIntelligenceSummary = {
  totalRecords: number;
  availableRecordTypes: DataRecordKind[];
  counts: Record<DataRecordKind, number>;
};

export type LocalIntelligenceQuality = {
  level: DataQualityLevel | "not_requested";
  issueCount: number;
  issueCodes: string[];
};

export type LocalIntelligenceCoverage = {
  start: string;
  end: string;
  totalDays: number;
  coveredDays: number;
  missingPeriods: string[];
  /** True when the period was too long to enumerate missing days. */
  limited: boolean;
};

export type LocalIntelligenceProvenance = {
  bySource: Record<string, number>;
  knownSourceRate: number;
  unknownSourceCount: number;
  totalRecords: number;
  notRequested: boolean;
};

/**
 * Deterministic, local-only result produced from a `DataContext`. It is purely
 * structural: record counts, coverage, data quality level and provenance. It
 * never performs medical interpretation and never calls external services.
 */
export type LocalIntelligenceResult = {
  version: number;
  generatedAt: string;
  period: DataContextPeriod;
  summary: LocalIntelligenceSummary;
  dataQuality: LocalIntelligenceQuality;
  coverage: LocalIntelligenceCoverage;
  provenance: LocalIntelligenceProvenance;
  explanations: LocalIntelligenceExplanation[];
};