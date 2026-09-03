import type {
  Activity,
  GlucoseReading,
  Meal,
  Note,
} from "@/lib/db/types";
import {
  ACTIVITY_TYPE_LABELS,
  GLUCOSE_CONTEXT_LABELS,
  MEAL_TYPE_LABELS,
} from "@/lib/health/constants";
import { formatDateShort, formatTime } from "@/lib/date";
import type {
  ReportCategory,
  ReportData,
  ReportSourceRecords,
  ReportSummary,
  ReportTimelineEntry,
} from "./report.types";
import type { Insight } from "@/lib/intelligence/types/insight.types";

export type BuildReportInput = {
  records: ReportSourceRecords;
  period: { start: string; end: string };
  categories: ReportCategory[];
  insights?: string[];
  generatedAt?: string;
};

function round(value: number | undefined, digits = 1): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Number(value.toFixed(digits));
}

function rangeAverage(glucose: GlucoseReading[]): number | null {
  if (glucose.length === 0) return null;
  const sum = glucose.reduce((acc, g) => acc + g.value, 0);
  return round(sum / glucose.length);
}

/** Builds the numeric summary for a set of records. */
export function buildReportSummary(
  glucose: GlucoseReading[],
  meals: Meal[],
  activities: Activity[],
  notes: Note[],
): ReportSummary {
  const values = glucose.map((g) => g.value);
  const totalMinutes = activities.reduce(
    (acc, a) => acc + a.durationMinutes,
    0,
  );
  return {
    glucoseCount: glucose.length,
    glucoseAverage: rangeAverage(glucose),
    glucoseMinimum: values.length ? round(Math.min(...values)) : null,
    glucoseMaximum: values.length ? round(Math.max(...values)) : null,
    mealCount: meals.length,
    activityCount: activities.length,
    activityTotalMinutes: totalMinutes,
    noteCount: notes.length,
    totalRecords:
      glucose.length + meals.length + activities.length + notes.length,
  };
}

function glucoseDetail(record: GlucoseReading): string {
  return `${record.value} mg/dL · ${GLUCOSE_CONTEXT_LABELS[record.context]}`;
}

function mealDetail(record: Meal): string {
  const label = MEAL_TYPE_LABELS[record.type];
  return record.description ? `${label} · ${record.description}` : label;
}

function activityDetail(record: Activity): string {
  const label = ACTIVITY_TYPE_LABELS[record.type];
  return `${label} · ${record.durationMinutes} min`;
}

/** Builds the ordered, time-descending timeline for a report. */
export function buildReportTimeline(
  glucose: GlucoseReading[],
  meals: Meal[],
  activities: Activity[],
  notes: Note[],
): ReportTimelineEntry[] {
  const entries: ReportTimelineEntry[] = [
    ...glucose.map((g) => ({
      at: g.measuredAt,
      type: "glucose" as const,
      label: "Glicemia",
      detail: glucoseDetail(g),
    })),
    ...meals.map((m) => ({
      at: m.consumedAt,
      type: "meal" as const,
      label: MEAL_TYPE_LABELS[m.type],
      detail: mealDetail(m),
    })),
    ...activities.map((a) => ({
      at: a.startedAt,
      type: "activity" as const,
      label: ACTIVITY_TYPE_LABELS[a.type],
      detail: activityDetail(a),
    })),
    ...notes.map((n) => ({
      at: n.createdAt,
      type: "note" as const,
      label: "Observação",
      detail: n.content,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return entries;
}

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  glucose: "Glicemia",
  meals: "Refeições",
  activity: "Atividade física",
  notes: "Observações",
};

/** Determines which record kinds are included given the selected categories. */
export function resolveIncludedKinds(
  categories: ReportCategory[],
): { glucose: boolean; meals: boolean; activity: boolean; notes: boolean } {
  const set = new Set(categories);
  return {
    glucose: set.has("glucose"),
    meals: set.has("meals"),
    activity: set.has("activity"),
    notes: set.has("notes"),
  };
}

/** Builds the full structured report. Timestamp/insight text is added when provided. */
export function buildReportData(input: BuildReportInput): ReportData {
  const { categories, period, records, insights, generatedAt } = input;
  const kinds = resolveIncludedKinds(categories);

  const glucose = kinds.glucose ? records.glucose : [];
  const meals = kinds.meals ? records.meals : [];
  const activities = kinds.activity ? records.activities : [];
  const notes = kinds.notes ? records.notes : [];

  const summary = buildReportSummary(glucose, meals, activities, notes);
  const timeline = buildReportTimeline(glucose, meals, activities, notes);

  return {
    generatedAt: generatedAt ?? new Date().toISOString(),
    period,
    categories,
    summary,
    timeline,
    insights: insights ?? [],
  };
}

function csvEscape(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(",");
}

/** Renders a single record as a CSV row for the given kind. */
export function buildCsvRows(
  records: Pick<
    ReportSourceRecords,
    "glucose" | "meals" | "activities" | "notes"
  >,
  categories: ReportCategory[],
): string {
  const kinds = resolveIncludedKinds(categories);
  const rows: string[] = [];

  if (kinds.glucose) {
    rows.push(toCsvRow(["tipo", "data", "hora", "valor", "contexto", "observações"]));
    for (const g of records.glucose) {
      rows.push(
        toCsvRow([
          "glicemia",
          formatDateShort(g.measuredAt),
          formatTime(g.measuredAt),
          g.value,
          GLUCOSE_CONTEXT_LABELS[g.context],
          g.notes ?? "",
        ]),
      );
    }
  }

  if (kinds.meals) {
    rows.push(toCsvRow(["tipo", "data", "hora", "refeição", "descrição"]));
    for (const m of records.meals) {
      rows.push(
        toCsvRow([
          "refeição",
          formatDateShort(m.consumedAt),
          formatTime(m.consumedAt),
          MEAL_TYPE_LABELS[m.type],
          m.description,
        ]),
      );
    }
  }

  if (kinds.activity) {
    rows.push(toCsvRow(["tipo", "data", "hora", "atividade", "minutos"]));
    for (const a of records.activities) {
      rows.push(
        toCsvRow([
          "atividade",
          formatDateShort(a.startedAt),
          formatTime(a.startedAt),
          ACTIVITY_TYPE_LABELS[a.type],
          a.durationMinutes,
        ]),
      );
    }
  }

  if (kinds.notes) {
    rows.push(toCsvRow(["tipo", "data", "hora", "observação"]));
    for (const n of records.notes) {
      rows.push(
        toCsvRow([
          "observação",
          formatDateShort(n.createdAt),
          formatTime(n.createdAt),
          n.content,
        ]),
      );
    }
  }

  return rows.join("\n");
}

/** Serializes the structured report to JSON and infers a report title. Not bundled here. */
export function serializeReportJson(data: ReportData): string {
  return JSON.stringify(data, null, 2);
}

/** Human-friendly timestamp used in file names. Local-time based. */
export function fileTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

/** Collects insight title + description into a flat list of strings. */
export function insightStrings(insights: Insight[]): string[] {
  return insights.map((i) =>
    i.description ? `${i.title}: ${i.description}` : i.title,
  );
}

export { CATEGORY_LABEL };
