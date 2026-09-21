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

export const DATA_CONTEXT_VERSION = 1;

export type DataContextPeriod = {
  start: string;
  end: string;
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
  notes?: string;
  provenance?: DataProvenance;
};

export type NormalizedActivityRecord = {
  kind: "activity";
  id: string;
  type: Activity["type"];
  durationMinutes: number;
  startedAt: string;
  notes?: string;
  provenance?: DataProvenance;
};

export type NormalizedMedicationRecord = {
  kind: "medication";
  id: string;
  name: string;
  dosage?: string;
  unit?: string;
  frequency?: string;
  route?: string;
  medicatedAt: string;
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
  | NormalizedMedicationRecord
  | NormalizedNoteRecord;

export type DataContextRecords = {
  glucose: NormalizedGlucoseRecord[];
  meals: NormalizedMealRecord[];
  activities: NormalizedActivityRecord[];
  medications: NormalizedMedicationRecord[];
  notes: NormalizedNoteRecord[];
};

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
  contextVersion: number;
  generatedAt: string;
  period: DataContextPeriod;
  records: DataContextRecords;
  statistics?: IntelligenceAnalytics;
  insights?: Insight[];
  quality?: DataQuality;
  provenance?: DataContextProvenanceSummary;
};

export type DataContextIncludeOptions = {
  glucose?: boolean;
  meals?: boolean;
  activities?: boolean;
  medications?: boolean;
  notes?: boolean;
  statistics?: boolean;
  insights?: boolean;
  quality?: boolean;
  provenance?: boolean;
};

export type DataContextOptions = {
  userId: string;
  period: DataContextPeriod;
  include?: DataContextIncludeOptions;
};

export type DataContextResult =
  | { ok: true; data: DataContext }
  | { ok: false; error: string };