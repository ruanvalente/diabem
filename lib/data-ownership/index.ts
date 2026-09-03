export { dataOwnershipService, DEFAULT_SCOPE } from "./data-ownership.service";

export * from "./export/exporter";
export {
  serializeToJson,
  serializeGlucoseToCsv,
  serializeMealsToCsv,
  serializeActivitiesToCsv,
  serializeNotesToCsv,
} from "./export";
export {
  readFileContent,
  parseFileContent,
  buildImportPreview,
  executeImport,
  detectFileKind,
  validateFile,
  deduplicateGlucose,
  deduplicateMeals,
  deduplicateActivities,
  deduplicateNotes,
  normalizeImportData,
} from "./import";
export { canShare, shareFile } from "./share";
export type { ShareResult, ShareableFile } from "./share";

export * from "./types/export.types";
export * from "./types/import.types";
export * from "./types/backup.types";
