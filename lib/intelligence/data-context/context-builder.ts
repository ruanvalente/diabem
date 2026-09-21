import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import { analyzeIntelligence } from "../intelligence.service";
import type { DataContext, DataContextPeriod } from "./data-context.types";
import { DATA_CONTEXT_VERSION } from "./data-context.types";
import type { DataContextSelection } from "./context-options";
import { shouldComputeAnalytics } from "./context-options";
import {
  normalizeActivityRecord,
  normalizeGlucoseRecord,
  normalizeMealRecord,
  normalizeMedicationRecord,
  normalizeNoteRecord,
  summarizeProvenance,
} from "./context-normalizer";

export type ContextSourceData = {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  medications: Medication[];
  notes: Note[];
};

export type ContextBuildInput = {
  period: DataContextPeriod;
  selection: DataContextSelection;
  sources: ContextSourceData;
};

function buildRecords(
  selection: DataContextSelection,
  sources: ContextSourceData
) {
  const { glucose, meals, activities, medications, notes } = sources;

  return {
    glucose: selection.recordKinds.includes("glucose")
      ? glucose.map(normalizeGlucoseRecord)
      : [],
    meals: selection.recordKinds.includes("meals")
      ? meals.map(normalizeMealRecord)
      : [],
    activities: selection.recordKinds.includes("activities")
      ? activities.map(normalizeActivityRecord)
      : [],
    medications: selection.recordKinds.includes("medications")
      ? medications.map(normalizeMedicationRecord)
      : [],
    notes: selection.recordKinds.includes("notes")
      ? notes.map(normalizeNoteRecord)
      : [],
  };
}

/**
 * Builds a `DataContext` from already-loaded, user-scoped source records.
 *
 * This is a pure function (no I/O): it normalizes the raw records, reuses the
 * existing Intelligence pipeline for statistics/insights/quality — never
 * duplicating those calculations — and aggregates provenance.
 */
export function buildDataContext(input: ContextBuildInput): DataContext {
  const { period, selection, sources } = input;

  const records = buildRecords(selection, sources);

  const provenance = selection.provenance
    ? summarizeProvenance([
        ...(selection.recordKinds.includes("glucose") ? sources.glucose : []),
        ...(selection.recordKinds.includes("meals") ? sources.meals : []),
        ...(selection.recordKinds.includes("activities")
          ? sources.activities
          : []),
        ...(selection.recordKinds.includes("medications")
          ? sources.medications
          : []),
        ...(selection.recordKinds.includes("notes") ? sources.notes : []),
      ])
    : undefined;

  let statistics: DataContext["statistics"];
  let insights: DataContext["insights"];
  let quality: DataContext["quality"];

  if (shouldComputeAnalytics(selection)) {
    const analysis = analyzeIntelligence(
      sources.glucose,
      sources.meals,
      sources.activities,
      sources.notes,
      { start: period.start, end: period.end }
    );

    if (analysis.ok) {
      if (selection.statistics) statistics = analysis.data.analytics;
      if (selection.insights) insights = analysis.data.insights;
      if (selection.quality) quality = analysis.data.analytics.dataQuality;
    }
  }

  return {
    contextVersion: DATA_CONTEXT_VERSION,
    generatedAt: new Date().toISOString(),
    period,
    records,
    statistics,
    insights,
    quality,
    provenance,
  };
}