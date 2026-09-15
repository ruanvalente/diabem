import { glucoseRepository } from "@/lib/db/repositories/glucose.repository";
import { mealRepository } from "@/lib/db/repositories/meal.repository";
import { activityRepository } from "@/lib/db/repositories/activity.repository";
import { noteRepository } from "@/lib/db/repositories/note.repository";
import type {
  DataProvenance,
  GlucoseReading,
  Meal,
  Activity,
  Note,
} from "@/lib/db/types";
import { DataSource } from "@/lib/db/types";
import { analyzeIntelligence } from "../intelligence.service";
import type { AnalysisPeriod } from "../types/analytics.types";
import type {
  DataContext,
  DataContextOptions,
  DataContextProvenanceSummary,
  DataContextRecord,
  DataContextServiceResult,
} from "./data-context.types";

function summarizeProvenance(
  records: { provenance?: DataProvenance }[]
): DataContextProvenanceSummary {
  const bySource = new Map<DataSource, number>();
  let unknown = 0;

  for (const record of records) {
    const source = record.provenance?.source;
    if (source) {
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
    } else {
      unknown += 1;
    }
  }

  const total = records.length;

  return {
    bySource: [...bySource.entries()].map(([source, count]) => ({
      source,
      count,
    })),
    knownSourceRate: total === 0 ? 0 : (total - unknown) / total,
    unknownSourceCount: unknown,
    totalRecords: total,
  };
}

function normalizeRecords(input: {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  notes: Note[];
  includeNotes: boolean;
}): DataContextRecord[] {
  const records: DataContextRecord[] = [
    ...input.glucose.map<DataContextRecord>((g) => ({
      kind: "glucose",
      id: g.id,
      value: g.value,
      context: g.context,
      measuredAt: g.measuredAt,
      notes: g.notes,
      provenance: g.provenance,
    })),
    ...input.meals.map<DataContextRecord>((m) => ({
      kind: "meal",
      id: m.id,
      type: m.type,
      description: m.description,
      consumedAt: m.consumedAt,
      provenance: m.provenance,
    })),
    ...input.activities.map<DataContextRecord>((a) => ({
      kind: "activity",
      id: a.id,
      type: a.type,
      durationMinutes: a.durationMinutes,
      startedAt: a.startedAt,
      provenance: a.provenance,
    })),
  ];

  if (input.includeNotes) {
    records.push(
      ...input.notes.map<DataContextRecord>((n) => ({
        kind: "note",
        id: n.id,
        content: n.content,
        createdAt: n.createdAt,
        provenance: n.provenance,
      }))
    );
  }

  const timestamp = (record: DataContextRecord): string => {
    switch (record.kind) {
      case "glucose":
        return record.measuredAt;
      case "meal":
        return record.consumedAt;
      case "activity":
        return record.startedAt;
      case "note":
        return record.createdAt;
    }
  };

  return records.sort((a, b) => timestamp(a).localeCompare(timestamp(b)));
}

/**
 * Builds a structured, explainable context of the user's data for a period.
 *
 * This is the boundary between the application and any future AI layer: the AI
 * must consume the output of this service (records, statistics, insights,
 * quality, provenance) instead of accessing IndexedDB or the crypto layer
 * directly. No data is shared automatically — the result stays local.
 */
export async function getDataContext(
  options: DataContextOptions
): Promise<DataContextServiceResult> {
  try {
    const { userId, period, includeNotes = false } = options;
    const filter = { from: period.from, to: period.to };

    const [glucose, meals, activities, notes] = await Promise.all([
      glucoseRepository.findByUser(userId, filter),
      mealRepository.findByUser(userId, filter),
      activityRepository.findByUser(userId, filter),
      noteRepository.findByUser(userId, filter),
    ]);

    const analysisPeriod: AnalysisPeriod = {
      start: period.from,
      end: period.to,
    };

    const analysis = analyzeIntelligence(
      glucose,
      meals,
      activities,
      notes,
      analysisPeriod
    );
    if (!analysis.ok) {
      return { ok: false, error: analysis.error };
    }

    const data: DataContext = {
      period,
      records: normalizeRecords({ glucose, meals, activities, notes, includeNotes }),
      statistics: analysis.data.analytics,
      insights: analysis.data.insights,
      quality: analysis.data.analytics.dataQuality,
      provenance: summarizeProvenance([...glucose, ...meals, ...activities, ...notes]),
    };

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao construir o contexto",
    };
  }
}