import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDatabase } from "../db/database";
import { deviceRepository } from "../db/repositories/device.repository";
import { glucoseRepository } from "../db/repositories/glucose.repository";
import { cryptoService } from "../crypto/crypto.service";
import { setSessionDataKey } from "../db/session-key";
import type { Device, DeviceMeasurement } from "./types/device.types";
import { DeviceError } from "./core/device.errors";
import { DeviceManager } from "./core/device-manager";
import { DeviceIntegrationService } from "./device-integration.service";
import type { DeviceAdapter } from "./core/device-adapter";

const TEST_USER_ID = "test-user-devices";

function glucoseMeasurement(
  overrides: Partial<DeviceMeasurement> = {}
): DeviceMeasurement {
  return {
    type: "glucose",
    value: 120,
    unit: "mg/dL",
    measuredAt: "2026-09-01T08:00:00.000Z",
    source: {
      deviceId: "dev-1",
      deviceName: "Glicosímetro",
      transport: "bluetooth",
      adapterId: "test-glucose",
    },
    ...overrides,
  };
}

function device(overrides: Partial<Device> = {}): Device {
  return {
    id: "dev-1",
    name: "Glicosímetro",
    type: "glucose",
    transport: "bluetooth",
    adapterId: "test-glucose",
    manufacturer: "DiaBem",
    model: "G-100",
    ...overrides,
  };
}

function makeService(measurements: DeviceMeasurement[]) {
  const adapter: DeviceAdapter = {
    id: "test-glucose",
    name: "Glucose",
    isSupported: () => true,
    discover: vi.fn().mockResolvedValue([device()]),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue({ format: "text/plain", data: "{}" }),
    parse: () => ({ measurements: [], droppedCount: 0 }),
    sync: vi.fn().mockResolvedValue(measurements),
  };
  const manager = new DeviceManager();
  manager.register(adapter);
  return new DeviceIntegrationService(manager);
}

beforeEach(async () => {
  const db = getDatabase();
  await db.transaction(
    "rw",
    [
      db.glucoseReadings,
      db.users,
      db.sessions,
      db.devices,
      db.syncHistory,
    ],
    async () => {
      await Promise.all([
        db.glucoseReadings.where("userId").equals(TEST_USER_ID).delete(),
        db.devices.where("userId").equals(TEST_USER_ID).delete(),
        db.syncHistory.where("userId").equals(TEST_USER_ID).delete(),
      ]);
    }
  );

  const result = await cryptoService.createUserKeys("test-password");
  if (!result.ok) throw new Error("key derivation failed");
  setSessionDataKey(result.data.dataKey);
});

describe("DeviceIntegrationService — registry", () => {
  it("registers and lists a device scoped to the user", async () => {
    const service = makeService([]);
    await service.registerDevice(TEST_USER_ID, device());
    const devices = await service.listDevices(TEST_USER_ID);
    expect(devices).toHaveLength(1);
    expect(devices[0].id).toBe("dev-1");
    expect(devices[0].lastConnectedAt).toBeTruthy();
  });

  it("does not leak devices across users", async () => {
    const service = makeService([]);
    await service.registerDevice(TEST_USER_ID, device());
    const others = await service.listDevices("other-user");
    expect(others).toHaveLength(0);
  });

  it("gets and removes a device", async () => {
    const service = makeService([]);
    await service.registerDevice(TEST_USER_ID, device());
    expect(await service.getDevice(TEST_USER_ID, "dev-1")).toBeDefined();
    await service.removeDevice(TEST_USER_ID, "dev-1");
    expect(await service.getDevice(TEST_USER_ID, "dev-1")).toBeUndefined();
  });
});

describe("DeviceIntegrationService — sync preview", () => {
  it("returns a preview without writing glucose records", async () => {
    const service = makeService([glucoseMeasurement()]);
    const preview = await service.syncDevice(TEST_USER_ID, device());

    expect(preview.result.newRecords).toBe(1);
    expect(preview.result.totalRecords).toBe(1);
    expect(preview.result.duplicateCount).toBe(0);

    const persisted = await glucoseRepository.findByUser(TEST_USER_ID);
    expect(persisted).toHaveLength(0);
  });

  it("deduplicates identical measurements within a single payload", async () => {
    const service = makeService([glucoseMeasurement(), glucoseMeasurement()]);
    const preview = await service.syncDevice(TEST_USER_ID, device());
    expect(preview.result.totalRecords).toBe(2);
    expect(preview.result.newRecords).toBe(1);
    expect(preview.result.duplicateCount).toBe(1);
  });

  it("reports zero new records when the data already exists", async () => {
    const service = makeService([glucoseMeasurement()]);
    await service.confirmImport(TEST_USER_ID, await service.syncDevice(TEST_USER_ID, device()));

    const second = await service.syncDevice(TEST_USER_ID, device());
    expect(second.result.newRecords).toBe(0);
    expect(second.result.duplicateCount).toBe(1);
  });

  it("maps sync errors to a friendly DeviceError", async () => {
    const failing: Device = device();
    // Force failure by replacing the adapter's sync.
    const manager = new DeviceManager();
    manager.register({
      id: "test-glucose",
      name: "Glucose",
      isSupported: () => true,
      discover: vi.fn().mockResolvedValue([failing]),
      connect: vi.fn(),
      disconnect: vi.fn(),
      read: vi.fn(),
      parse: () => ({ measurements: [], droppedCount: 0 }),
      sync: vi.fn().mockRejectedValue(new Error("GATT 133")),
    });
    const failingService = new DeviceIntegrationService(manager);
    await expect(
      failingService.syncDevice(TEST_USER_ID, failing)
    ).rejects.toBeInstanceOf(DeviceError);
  });
});

describe("DeviceIntegrationService — confirm import", () => {
  it("persists glucose, updates the registry and records history", async () => {
    const service = makeService([glucoseMeasurement()]);
    const preview = await service.syncDevice(TEST_USER_ID, device());
    const result = await service.confirmImport(TEST_USER_ID, preview);

    expect(result.newRecords).toBe(1);

    const persisted = await glucoseRepository.findByUser(TEST_USER_ID);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].value).toBe(120);

    const devices = await service.listDevices(TEST_USER_ID);
    expect(devices[0].lastSyncAt).toBeTruthy();

    const history = await service.getSyncHistory(TEST_USER_ID);
    expect(history).toHaveLength(1);
    expect(history[0].importedCount).toBe(1);
    expect(history[0].deviceId).toBe("dev-1");
    expect(history[0].ok).toBe(true);
  });

  it("records history isolated per user", async () => {
    const service = makeService([glucoseMeasurement()]);
    const preview = await service.syncDevice(TEST_USER_ID, device());
    await service.confirmImport(TEST_USER_ID, preview);
    expect(await service.getSyncHistory("other-user")).toHaveLength(0);
  });

  it("clears sync history through the repository", async () => {
    const service = makeService([glucoseMeasurement()]);
    const preview = await service.syncDevice(TEST_USER_ID, device());
    await service.confirmImport(TEST_USER_ID, preview);
    await deviceRepository.clearHistory(TEST_USER_ID);
    expect(await service.getSyncHistory(TEST_USER_ID)).toHaveLength(0);
  });
});
