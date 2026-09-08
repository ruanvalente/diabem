import { describe, it, expect } from "vitest";
import {
  parseGlucoseEnvelope,
  envelopeToMeasurements,
  parseGlucoseRawData,
} from "./glucose-protocol";
import { DeviceError } from "./device.errors";

const DEVICE = {
  id: "dev-1",
  name: "Glicosímetro",
  manufacturer: "DiaBem",
  model: "G-100",
};

describe("parseGlucoseEnvelope", () => {
  it("parses a valid envelope", () => {
    const envelope = parseGlucoseEnvelope(
      JSON.stringify({ records: [{ fixedtime: 1700000000, glucose: 120 }] })
    );
    expect(envelope.records).toHaveLength(1);
  });

  it("throws malformed-packet on invalid JSON", () => {
    expect(() => parseGlucoseEnvelope("not json")).toThrow(DeviceError);
  });

  it("throws malformed-packet when records is missing", () => {
    expect(() => parseGlucoseEnvelope("{}")).toThrow(DeviceError);
    expect(() => parseGlucoseEnvelope('{"records": {}}')).toThrow(DeviceError);
  });
});

describe("envelopeToMeasurements", () => {
  it("maps records to neutral glucose measurements", () => {
    const { measurements, droppedCount } = envelopeToMeasurements({
      envelope: {
        records: [
          { id: "r1", fixedtime: 1700000000, glucose: 120, unit: "mg/dL" },
        ],
      },
      deviceId: DEVICE.id,
      deviceName: DEVICE.name,
      manufacturer: DEVICE.manufacturer,
      model: DEVICE.model,
      transport: "bluetooth",
      adapterId: "bt",
    });

    expect(droppedCount).toBe(0);
    expect(measurements).toHaveLength(1);
    expect(measurements[0]).toMatchObject({
      type: "glucose",
      value: 120,
      unit: "mg/dL",
      measuredAt: new Date(1700000000 * 1000).toISOString(),
      source: {
        deviceId: "dev-1",
        sourceRecordId: "r1",
        transport: "bluetooth",
        adapterId: "bt",
      },
    });
  });

  it("drops records with non-finite value or missing timestamp", () => {
    const { measurements, droppedCount } = envelopeToMeasurements({
      envelope: {
        records: [
          { fixedtime: 1700000000, glucose: NaN },
          { fixedtime: 0, glucose: 120 },
          { fixedtime: 1700000000, glucose: 100 },
        ],
      },
      deviceId: "dev-1",
      deviceName: "Glicosímetro",
      transport: "serial",
      adapterId: "serial",
    });

    expect(droppedCount).toBe(2);
    expect(measurements).toHaveLength(1);
    expect(measurements[0].value).toBe(100);
  });
});

describe("parseGlucoseRawData", () => {
  it("parses a JSON raw payload end to end", () => {
    const raw = {
      format: "application/json",
      data: JSON.stringify({
        records: [{ id: "a", fixedtime: 1700000000, glucose: 140 }],
      }),
    };

    const { measurements, droppedCount } = parseGlucoseRawData({
      raw,
      device: DEVICE,
      transport: "bluetooth",
      adapterId: "bt",
    });

    expect(droppedCount).toBe(0);
    expect(measurements[0].value).toBe(140);
    expect(measurements[0].source.sourceRecordId).toBe("a");
  });

  it("throws invalid-data for unsupported formats", () => {
    expect(() =>
      parseGlucoseRawData({
        raw: { format: "image/png", data: "not used" },
        device: DEVICE,
        transport: "bluetooth",
        adapterId: "bt",
      })
    ).toThrow(DeviceError);
  });

  it("decodes binary payloads", () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ records: [{ fixedtime: 1700000000, glucose: 90 }] })
    );
    const { measurements } = parseGlucoseRawData({
      raw: { format: "text/plain", data: bytes },
      device: DEVICE,
      transport: "serial",
      adapterId: "serial",
    });
    expect(measurements[0].value).toBe(90);
  });
});
