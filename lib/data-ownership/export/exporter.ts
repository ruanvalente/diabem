import { glucoseRepository } from "../../db/repositories/glucose.repository";
import { mealRepository } from "../../db/repositories/meal.repository";
import { activityRepository } from "../../db/repositories/activity.repository";
import { noteRepository } from "../../db/repositories/note.repository";
import type {
  DiaBemExport,
  ExportOptions,
  ExportScope,
} from "../types/export.types";
import { CURRENT_EXPORT_VERSION, APPLICATION_NAME } from "../types/export.types";
import { serializeToJson } from "./json-serializer";
import {
  serializeGlucoseToCsv,
  serializeMealsToCsv,
  serializeActivitiesToCsv,
  serializeNotesToCsv,
} from "./csv-serializer";

type ExportFile = {
  fileName: string;
  content: string;
  mimeType: string;
};

/**
 * Collects data from repositories according to scope and optional period filter.
 * The userId is stripped from each record so it is not part of the public contract.
 */
async function collectData(
  userId: string,
  scope: ExportScope,
  period?: { from?: string; to?: string }
) {
  const filter = { from: period?.from, to: period?.to };

  const [glucose, meals, activities, notes] = await Promise.all([
    scope.glucose ? glucoseRepository.findByUser(userId, filter) : [],
    scope.meals ? mealRepository.findByUser(userId, filter) : [],
    scope.activities ? activityRepository.findByUser(userId, filter) : [],
    scope.notes ? noteRepository.findByUser(userId, filter) : [],
  ]);

  const stripUser = <T extends { userId: string }>(records: T[]) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    records.map(({ userId, ...rest }) => rest);

  return {
    glucose: stripUser(glucose),
    meals: stripUser(meals),
    activities: stripUser(activities),
    notes: stripUser(notes),
  };
}

/**
 * Builds the export envelope from collected data.
 */
function buildExportEnvelope(
  data: Awaited<ReturnType<typeof collectData>>,
  scope: ExportScope,
  period?: { from?: string; to?: string }
): DiaBemExport {
  return {
    version: CURRENT_EXPORT_VERSION,
    application: APPLICATION_NAME,
    exportedAt: new Date().toISOString(),
    exportScope: scope,
    period,
    data,
  };
}

/**
 * Exports data as JSON — a single file with all selected data.
 */
export async function exportAsJson(
  userId: string,
  options: ExportOptions
): Promise<ExportFile> {
  const data = await collectData(userId, options.scope, options.period);
  const envelope = buildExportEnvelope(data, options.scope, options.period);
  const content = serializeToJson(envelope);

  const timestamp = new Date().toISOString().slice(0, 10);
  return {
    fileName: `diabem-export-${timestamp}.json`,
    content,
    mimeType: "application/json",
  };
}

/**
 * Exports data as separate CSV files, one per entity type.
 */
export async function exportAsCsv(
  userId: string,
  options: ExportOptions
): Promise<ExportFile[]> {
  const data = await collectData(userId, options.scope, options.period);
  const timestamp = new Date().toISOString().slice(0, 10);
  const files: ExportFile[] = [];

  if (data.glucose.length > 0) {
    files.push({
      fileName: `diabem-glucose-${timestamp}.csv`,
      content: serializeGlucoseToCsv(data.glucose),
      mimeType: "text/csv",
    });
  }

  if (data.meals.length > 0) {
    files.push({
      fileName: `diabem-meals-${timestamp}.csv`,
      content: serializeMealsToCsv(data.meals),
      mimeType: "text/csv",
    });
  }

  if (data.activities.length > 0) {
    files.push({
      fileName: `diabem-activities-${timestamp}.csv`,
      content: serializeActivitiesToCsv(data.activities),
      mimeType: "text/csv",
    });
  }

  if (data.notes.length > 0) {
    files.push({
      fileName: `diabem-notes-${timestamp}.csv`,
      content: serializeNotesToCsv(data.notes),
      mimeType: "text/csv",
    });
  }

  if (files.length === 0) {
    // Return an empty glucose CSV as a minimal placeholder
    files.push({
      fileName: `diabem-glucose-${timestamp}.csv`,
      content: serializeGlucoseToCsv([]),
      mimeType: "text/csv",
    });
  }

  return files;
}

/**
 * Triggers a browser download for the given file content.
 */
export function triggerDownload(file: ExportFile): void {
  const blob = new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
