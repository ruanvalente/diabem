import type { AnalysisPeriod } from "@/lib/intelligence/types/analytics.types";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Note,
} from "@/lib/db/types";

/** Categories the user can include in a report. */
export type ReportCategory =
  | "glucose"
  | "meals"
  | "activity"
  | "notes";

/** Supported output formats. */
export type ReportFormat = "pdf" | "csv" | "json";

/** Summary numbers for a report, derived from the period records. */
export type ReportSummary = {
  glucoseCount: number;
  glucoseAverage: number | null;
  glucoseMinimum: number | null;
  glucoseMaximum: number | null;
  mealCount: number;
  activityCount: number;
  activityTotalMinutes: number;
  noteCount: number;
  totalRecords: number;
};

/** A single row in the report timeline. */
export type ReportTimelineEntry = {
  at: string;
  type: "glucose" | "meal" | "activity" | "note";
  label: string;
  detail: string;
};

/** Structured, serializable report produced by the builder. */
export type ReportData = {
  generatedAt: string;
  period: AnalysisPeriod;
  categories: ReportCategory[];
  summary: ReportSummary;
  timeline: ReportTimelineEntry[];
  insights: string[];
};

/** The raw records used to build a report. */
export type ReportSourceRecords = {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  notes: Note[];
};
