import { describe, it, expect } from "vitest";
import {
  measurementToGlucose,
  deviceMeasurementKey,
  buildSyncResult,
} from "./device-normalizer";
import { DeviceError } from "./device.errors";
import type { DeviceMeasurement } from "../types/device.types";

function glucoseMeasurement(
  overrides: Partial<DeviceMeasurement> = {}
): DeviceMeasurement {
  return {
    type: "glucose",
    value: 120.5,
    unit: "mg/dL",
    measuredAt: "2026-09-01T08:00:00.000Z",
    source: {
      deviceId: "dev-1",
      deviceName: "Glicosímetro",
      manufacturer: "DiaBem",
      model: "G-100",
      transport: "bluetooth",
      adapterId: "bt",
    },
    ...overrides,
  };
}

describe("measurementToGlucose", () => {
  it("converts a glucose measurement to the app entity shape", () => {
    const record = measurementToGlucose(glucoseMeasurement());
    expect(record.value).toBe(120.5);
    expect(record.unit).toBe("mg/dL");
    expect(record.context).toBe("other");
    expect(record.measuredAt).toBe("2026-09-01T08:00:00.000Z");
    expect(record.createdAt).toBe("2026-09-01T08:00:00.000Z");
    expect(record.updatedAt).toBe("2026-09-01T08:00:00.000Z");
  });

  it("adds a provenance note with the device name and native id when present", () => {
    const record = measurementToGlucose(
      glucoseMeasurement({
        source: {
          ...glucoseMeasurement().source,
          sourceRecordId: "rec-42",
        },
      })
    );
    expect(record.notes).toBe("Origem: Glicosímetro (rec-42)");
  });

  it("records only the device name when there is no native id", () => {
    const record = measurementToGlucose(
      glucoseMeasurement({
        source: {
          ...glucoseMeasurement().source,
          sourceRecordId: undefined,
        },
      })
    );
    expect(record.notes).toBe("Origem: Glicosímetro");
  });

  it("leaves notes undefined when no provenance details exist", () => {
    const record = measurementToGlucose(
      glucoseMeasurement({
        source: {
          deviceId: "dev-1",
          transport: "serial",
          adapterId: "serial",
        },
      })
    );
    expect(record.notes).toBeUndefined();
  });

  it("rounds decimal values to two places", () => {
    const record = measurementToGlucose(
      glucoseMeasurement({ value: 123.4567 })
    );
    expect(record.value).toBe(123.46);
  });

  it("persists a dedup sourceKey matching the device measurement key", () => {
    const m = glucoseMeasurement({
      source: { ...glucoseMeasurement().source, sourceRecordId: "rec-9" },
    });
    const record = measurementToGlucose(m);
    expect(record.sourceKey).toBe(deviceMeasurementKey(m));
    expect(record.sourceKey).toBe("rec-9|2026-09-01T08:00:00.000Z|glucose|120.5");
  });

  it("throws invalid-data for non-glucose measurements", () => {
    expect(() =>
      measurementToGlucose(
        glucoseMeasurement({ type: "weight" } as DeviceMeasurement)
      )
    ).toThrow(DeviceError);
  });
});

describe("deviceMeasurementKey", () => {
  it("prefers the native source record id", () => {
    const m = glucoseMeasurement({
      source: {
        ...glucoseMeasurement().source,
        sourceRecordId: "rec-1",
      },
    });
    expect(deviceMeasurementKey(m)).toBe(
      "rec-1|2026-09-01T08:00:00.000Z|glucose|120.5"
    );
  });

  it("falls back to adapter + device + transport when no native id", () => {
    const m = glucoseMeasurement({
      source: {
        ...glucoseMeasurement().source,
        sourceRecordId: undefined,
      },
    });
    expect(deviceMeasurementKey(m)).toBe(
      "bt|dev-1|bluetooth|2026-09-01T08:00:00.000Z|glucose|120.5"
    );
  });

  it("produces different keys for different timestamps or values", () => {
    const base = glucoseMeasurement();
    const later = glucoseMeasurement({
      measuredAt: "2026-09-01T09:00:00.000Z",
    });
    const higher = glucoseMeasurement({ value: 200 });
    expect(deviceMeasurementKey(base)).not.toBe(deviceMeasurementKey(later));
    expect(deviceMeasurementKey(base)).not.toBe(deviceMeasurementKey(higher));
  });
});

describe("buildSyncResult", () => {
  it("summarizes counts and exposes the unique measurements", () => {
    const a = glucoseMeasurement({ value: 100 });
    const b = glucoseMeasurement({ value: 200, measuredAt: "2026-09-02T08:00:00Z" });
    const result = buildSyncResult({
      deviceId: "dev-1",
      measurements: [a, b, a],
      unique: [a, b],
      duplicateCount: 1,
      erroredCount: 0,
      message: "2 novo(s) registro(s) encontrado(s).",
    });
    expect(result.totalRecords).toBe(3);
    expect(result.newRecords).toBe(2);
    expect(result.duplicateCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(result.measurements).toEqual([a, b]);
  });
});
