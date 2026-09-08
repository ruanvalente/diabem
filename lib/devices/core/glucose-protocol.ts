/**
 * Shared protocol parser for glucose devices.
 *
 * This is the "Parser" layer of the pipeline:
 *
 *   Raw Data → Parser → DeviceMeasurement
 *
 * It must be a PURE, transport-agnostic function so it can be unit tested
 * without a browser or hardware. The parser understands ONLY a well-defined
 * JSON envelope produced by the (fictional but stable) DiaBem Glucose protocol:
 *
 *   {
 *     "records": [
 *       { "id": "...", "fixedtime": 1700000000, "glucose": 120, "unit": "mg/dL" }
 *     ]
 *   }
 *
 * A real vendor protocol would be handled by a dedicated adapter-level parser
 * that maps onto this same neutral `DeviceMeasurement` shape.
 */

import type {
  DeviceMeasurement,
  DeviceTransport,
  RawDeviceData,
} from "../types/device.types";
import type { ParsedDeviceData } from "../core/device-adapter";
import { DeviceError } from "../core/device.errors";

export type GlucoseProtocolRecord = {
  id?: string;
  /** Unix epoch seconds (UTC). */
  fixedtime: number;
  glucose: number;
  unit?: string;
};

export type GlucoseProtocolEnvelope = {
  records: GlucoseProtocolRecord[];
};

/**
 * Parse a JSON string into a validated glucose protocol envelope.
 * Throws `DeviceError` with `malformed-packet` on structural errors.
 */
export function parseGlucoseEnvelope(raw: string): GlucoseProtocolEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DeviceError({ code: "malformed-packet" });
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as GlucoseProtocolEnvelope).records)) {
    throw new DeviceError({ code: "malformed-packet" });
  }

  return parsed as GlucoseProtocolEnvelope;
}

/**
 * Convert a parsed protocol envelope into neutral `DeviceMeasurement` records.
 * Records with invalid numbers/timestamps are dropped and counted.
 */
export function envelopeToMeasurements(params: {
  envelope: GlucoseProtocolEnvelope;
  deviceId: string;
  deviceName: string;
  manufacturer?: string;
  model?: string;
  transport: DeviceTransport;
  adapterId: string;
}): ParsedDeviceData {
  const measurements: DeviceMeasurement[] = [];
  let droppedCount = 0;

  for (const record of params.envelope.records) {
    const value = Number(record.glucose);
    const measuredAt = new Date(record.fixedtime * 1000).toISOString();
    if (!Number.isFinite(value) || record.fixedtime <= 0) {
      droppedCount++;
      continue;
    }
    measurements.push({
      type: "glucose",
      value,
      unit: record.unit ?? "mg/dL",
      measuredAt,
      source: {
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        manufacturer: params.manufacturer,
        model: params.model,
        transport: params.transport,
        adapterId: params.adapterId,
        sourceRecordId: record.id,
      },
    });
  }

  return { measurements, droppedCount };
}

/**
 * End-to-end pure parser used by adapters: accept `RawDeviceData`, parse the
 * JSON envelope and map to measurements for the given device.
 */
export function parseGlucoseRawData(params: {
  raw: RawDeviceData;
  device: {
    id: string;
    name: string;
    manufacturer?: string;
    model?: string;
  };
  transport: DeviceTransport;
  adapterId: string;
}): ParsedDeviceData {
  if (params.raw.format !== "application/json" && params.raw.format !== "text/plain") {
    throw new DeviceError({ code: "invalid-data" });
  }

  const text =
    typeof params.raw.data === "string"
      ? params.raw.data
      : new TextDecoder().decode(params.raw.data);

  const envelope = parseGlucoseEnvelope(text);
  return envelopeToMeasurements({
    envelope,
    deviceId: params.device.id,
    deviceName: params.device.name,
    manufacturer: params.device.manufacturer,
    model: params.device.model,
    transport: params.transport,
    adapterId: params.adapterId,
  });
}
