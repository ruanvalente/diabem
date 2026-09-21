import { glucoseRepository } from "@/lib/db/repositories/glucose.repository";
import { mealRepository } from "@/lib/db/repositories/meal.repository";
import { activityRepository } from "@/lib/db/repositories/activity.repository";
import { medicationRepository } from "@/lib/db/repositories/medication.repository";
import { noteRepository } from "@/lib/db/repositories/note.repository";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import type {
  DataContextOptions,
  DataContextResult,
} from "./data-context.types";
import type { DataRecordKind } from "./context-options";
import {
  hasSelection,
  resolveSelection,
  validateDataContextOptions,
} from "./context-options";
import {
  buildDataContext,
  type ContextSourceData,
} from "./context-builder";
import {
  filterRecordsByUser,
  stripInternalFieldsFromRecords,
} from "./context-security";

type UserScopedRecord = GlucoseReading | Meal | Activity | Medication | Note;

/**
 * The only boundary between application data and any consumer — including a
 * future AI layer. Consumers call `getContext`; they never touch IndexedDB,
 * Dexie, repositories, auth or crypto material directly.
 */
export const dataContextService = {
  async getContext(options: DataContextOptions): Promise<DataContextResult> {
    const validation = validateDataContextOptions(options);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    const period = validation.period;
    const selection = resolveSelection(options.include);

    const nothingRequested =
      !hasSelection(selection) &&
      !selection.statistics &&
      !selection.insights &&
      !selection.quality &&
      !selection.provenance;

    if (nothingRequested) {
      return { ok: false, error: "Nenhum tipo de dado foi solicitado." };
    }

    const filter = { from: period.start, to: period.end };

    try {
      const loaders: Record<
        DataRecordKind,
        () => Promise<UserScopedRecord[]>
      > = {
        glucose: () => glucoseRepository.findByUser(options.userId, filter),
        meals: () => mealRepository.findByUser(options.userId, filter),
        activities: () => activityRepository.findByUser(options.userId, filter),
        medications: () =>
          medicationRepository.findByUser(options.userId, filter),
        notes: () => noteRepository.findByUser(options.userId, filter),
      };

      const results = await Promise.all(
        selection.recordKinds.map(async (kind) => {
          const owned = filterRecordsByUser(
            await loaders[kind](),
            options.userId
          );
          return {
            kind,
            records: stripInternalFieldsFromRecords(owned),
          };
        })
      );

      const sources: ContextSourceData = {
        glucose: [],
        meals: [],
        activities: [],
        medications: [],
        notes: [],
      };

      for (const { kind, records } of results) {
        switch (kind) {
          case "glucose":
            sources.glucose = records as GlucoseReading[];
            break;
          case "meals":
            sources.meals = records as Meal[];
            break;
          case "activities":
            sources.activities = records as Activity[];
            break;
          case "medications":
            sources.medications = records as Medication[];
            break;
          case "notes":
            sources.notes = records as Note[];
            break;
        }
      }

      const data = buildDataContext({ period, selection, sources });
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao construir o contexto",
      };
    }
  },
};

/**
 * Shorthand for `dataContextService.getContext`.
 */
export function getDataContext(
  options: DataContextOptions
): Promise<DataContextResult> {
  return dataContextService.getContext(options);
}