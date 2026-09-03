import {
  exportAsJson,
  exportAsCsv,
  triggerDownload,
} from "./export/exporter";
import type { ExportOptions, ExportScope } from "./types/export.types";
import { shareFile, canShare, type ShareResult, type ShareableFile } from "./share";
import {
  readFileContent,
  parseFileContent,
  buildImportPreview,
  executeImport,
  detectFileKind,
  validateFile,
} from "./import";
import type { NormalizedImportData, ImportFileKind } from "./types/import.types";
import { deleteUserHealthData } from "./delete-service";

const DEFAULT_SCOPE: ExportScope = {
  glucose: true,
  meals: true,
  activities: true,
  notes: true,
};

type PreparedImport = {
  fileName: string;
  fileKind: ImportFileKind;
  normalizedData: NormalizedImportData;
  validationErrors: readonly { recordIndex: number; field: string; message: string }[];
};

/**
 * Central data-ownership service. Exposes well-defined functions that can
 * later be wrapped as MCP tools or AI context. The UI must go through this
 * service — never access IndexedDB or navigator.share() directly.
 */
export const dataOwnershipService = {
  /** Default scope exporting all data types. */
  get defaultScope(): ExportScope {
    return { ...DEFAULT_SCOPE };
  },

  /** Whether the browser can share files (Web Share API with files). */
  canShareFile(): boolean {
    return canShare();
  },

  /** Exports user data in the selected format and downloads it. */
  async exportUserData(userId: string, options: ExportOptions): Promise<void> {
    if (options.format === "json") {
      const file = await exportAsJson(userId, options);
      triggerDownload(file);
      return;
    }

    const files = await exportAsCsv(userId, options);
    for (const file of files) {
      triggerDownload(file);
    }
  },

  /** Exports data and returns it as shareable files. */
  async getExportableFiles(
    userId: string,
    options: ExportOptions
  ): Promise<ShareableFile[]> {
    if (options.format === "json") {
      const file = await exportAsJson(userId, options);
      return [file];
    }
    return exportAsCsv(userId, options);
  },

  /** Explicitly shares files; falls back to download when unsupported. */
  async shareFiles(files: ShareableFile[]): Promise<ShareResult> {
    for (const file of files) {
      const result = await shareFile(file);
      if (!result.ok) return result;
    }
    return { ok: true, method: "share" };
  },

  /** Reads, validates and parses an imported file into normalized data. */
  async prepareImport(file: File): Promise<PreparedImport> {
    const fileErrors = validateFile(file);
    if (fileErrors.length > 0) {
      const error = fileErrors[0];
      throw new Error(error.message);
    }

    const content = await readFileContent(file);
    const fileKind = detectFileKind(file.name, content);
    const { data, errors } = parseFileContent(content, fileKind);

    return {
      fileName: file.name,
      fileKind,
      normalizedData: data,
      validationErrors: errors,
    };
  },

  /** Builds a preview with deduplication counts for the current user. */
  buildPreview(
    userId: string,
    fileName: string,
    fileKind: ImportFileKind,
    normalizedData: NormalizedImportData
  ) {
    return buildImportPreview(userId, fileName, fileKind, normalizedData);
  },

  /** Executes the confirmed import (merge mode). */
  importUserData(userId: string, normalizedData: NormalizedImportData) {
    return executeImport(userId, normalizedData);
  },

  /** Deletes all health-data records for the current user. */
  deleteUserData(userId: string) {
    return deleteUserHealthData(userId);
  },
};

export { DEFAULT_SCOPE };
