import type { DiaBemExport } from "../types/export.types";
import {
  APPLICATION_NAME,
  CURRENT_EXPORT_VERSION,
} from "../types/export.types";

/**
 * Serializes an export payload to a JSON string.
 * The output is a human-readable, versioned JSON envelope.
 */
export function serializeToJson(exportData: DiaBemExport): string {
  const envelope: DiaBemExport = {
    version: CURRENT_EXPORT_VERSION,
    application: APPLICATION_NAME,
    exportedAt: exportData.exportedAt,
    ...(exportData.exportScope && { exportScope: exportData.exportScope }),
    ...(exportData.period && { period: exportData.period }),
    data: exportData.data,
  };

  return JSON.stringify(envelope, null, 2);
}
