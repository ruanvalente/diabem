/**
 * Normalization layer for device measurements.
 *
 * Converts transport-agnostic `DeviceMeasurement` records into the app's
 * domain entities (currently glucose readings). This is the boundary where
 * device data becomes "owned" app data and gains Data Ownership provenance
 * (`source`), ready for the repository. No vendor/protocol detail leaks here.
 */

import type { NormalizedGlucose } from "../../data-ownership/types/import.types";
import type {
  DeviceMeasurement,
  SyncResult,
} from "../types/device.types";
import { DeviceError } from "../core/device.errors";

/**
 * Converts a glucose `DeviceMeasurement` into a `NormalizedGlucose` (the shape
 * used by the importer and the glucose repository).
 *
 * The measurement timestamp is preserved as-is for data fidelity and
 * deduplication; the repository/user assigns `userId`/`id`.
 */
export function measurementToGlucose(
  measurement: DeviceMeasurement
): NormalizedGlucose {
  if (measurement.type !== "glucose") {
    throw new DeviceError({ code: "invalid-data" });
  }

  return {
    value: Math.round(measurement.value * 100) / 100,
    unit: "mg/dL",
    context: "other",
    measuredAt: measurement.measuredAt,
    notes: measurement.source.sourceRecordId
      ? `Origem: ${measurement.source.deviceName ?? "dispositivo"} (${measurement.source.sourceRecordId})`
      : measurement.source.deviceName
        ? `Origem: ${measurement.source.deviceName}`
        : undefined,
    createdAt: measurement.measuredAt,
    updatedAt: measurement.measuredAt,
  };
}

/**
 * Deduplication key for device-sourced records.
 *
 * Combines origin (source identifier), measurement timestamp, type and value so
 * re-syncing the same device never creates duplicates (matching the plan §7).
 * Prefers a reliable `sourceRecordId` when the device provides one.
 */
export function deviceMeasurementKey(m: DeviceMeasurement): string {
  const origin =
    m.source.sourceRecordId ??
    `${m.source.adapterId}|${m.source.deviceId}|${m.source.transport}`;
  return `${origin}|${m.measuredAt}|${m.type}|${m.value}`;
}

/**
 * Builds a `SyncResult` summary from raw measurements and a deduplicated set.
 */
export function buildSyncResult(params: {
  deviceId: string;
  measurements: DeviceMeasurement[];
  unique: DeviceMeasurement[];
  duplicateCount: number;
  erroredCount: number;
  message: string;
}): SyncResult {
  return {
    deviceId: params.deviceId,
    totalRecords: params.measurements.length,
    newRecords: params.unique.length,
    duplicateCount: params.duplicateCount,
    errorCount: params.erroredCount,
    message: params.message,
    measurements: params.unique,
  };
}
