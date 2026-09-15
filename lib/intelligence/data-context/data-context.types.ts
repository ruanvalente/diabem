import type {
  Activity,
  DataProvenance,
  GlucoseReading,
  Meal,
} from "@/lib/db/types";
import type {
  DataQuality,
  IntelligenceAnalytics,
} from "../types/analytics.types";
import type { Insight } from "../types/insight.types";

export type DataContextPeriod = {
  from: string;
  to: string;
};

export type NormalizedGlucoseRecord = {
  kind: "glucose";
  id: string;
  value: number;
  context: GlucoseReading["context"];
  measuredAt: string;
  notes?: string;
  provenance?: DataProvenance;
};

export type NormalizedMealRecord = {
  kind: "meal";
  id: string;
  type: Meal["type"];
  description: string;
  consumedAt: string;
  provenance?: DataProvenance;
};

export type NormalizedActivityRecord = {
  kind: "activity";
  id: string;
  type: Activity["type"];
  durationMinutes: number;
  startedAt: string;
  provenance?: DataProvenance;
};

export type NormalizedNoteRecord = {
  kind: "note";
  id: string;
  content: string;
  createdAt: string;
  provenance?: DataProvenance;
};

export type DataContextRecord =
  | NormalizedGlucoseRecord
  | NormalizedMealRecord
  | NormalizedActivityRecord
  | NormalizedNoteRecord;

export type DataSourceCount = {
  source: DataProvenance["source"];
  count: number;
};

export type DataContextProvenanceSummary = {
  bySource: DataSourceCount[];
  knownSourceRate: number;
  unknownSourceCount: number;
  totalRecords: number;
};

export type DataContext = {
  period: DataContextPeriod;
  records: DataContextRecord[];
  statistics: IntelligenceAnalytics;
  insights: Insight[];
  quality: DataQuality;
  provenance: DataContextProvenanceSummary;
};

export type DataContextOptions = {
  userId: string;
  period: DataContextPeriod;
  includeNotes?: boolean;
};

export type DataContextServiceResult =
  | { ok: true; data: DataContext }
  | { ok: false; error: string };