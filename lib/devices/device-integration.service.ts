/**
 * DeviceIntegrationService
 *
 * Central service for device integrations (Sprint 9). It owns the orchestration:
 * capability detection, discovery, connect, sync (with a two-phase preview →
 * import that keeps the user in control), deduplication against existing data,
 * persistence of the device registry and of the sync history.
 *
 * The service deliberately does NOT know about Bluetooth/Serial/vendors. It
 * works only through the registered `DeviceAdapter`s (the DeviceManager), and
 * converts their neutral `DeviceMeasurement`s into app domain entities.
 *
 * The UI must go through this service — never call the adapters or IndexedDB
 * directly. This keeps a clean boundary and prepares a future AI/MCP surface.
 */

import { DeviceManager } from "./core/device-manager";
import type { DeviceAdapter } from "./core/device-adapter";
import { DeviceError, toFriendlyMessage } from "./core/device.errors";
import {
  measurementToGlucose,
  deviceMeasurementKey,
  buildSyncResult,
} from "./core/device-normalizer";
import type {
  ConnectedDevice,
  Device,
  DeviceMeasurement,
  SyncHistoryEntry,
  SyncResult,
} from "./types/device.types";
import { deviceRepository } from "../db/repositories/device.repository";
import { glucoseRepository } from "../db/repositories/glucose.repository";
import type { NormalizedGlucose } from "../data-ownership/types/import.types";

export type SyncPreview = {
  device: Device;
  result: SyncResult;
};

export type SyncOutcome = SyncPreview & {
  /** Normalized glucose records that would be imported. */
  glucoseRecords: NormalizedGlucose[];
};

/**
 * Draft (preview) state of a sync: parsed + validated + deduplicated records
 * that are ready for the user to confirm, before anything is written.
 */
export interface DeviceIntegrationServiceInstance {
  getAvailableAdapters(): DeviceAdapter[];
  getSupportedAdapters(): DeviceAdapter[];
  discoverDevices(): Promise<Device[]>;
  discoverByAdapter(adapterId: string): Promise<Device[]>;
  connect(device: Device): Promise<void>;
  disconnect(): Promise<void>;
  /** Registry operations. */
  registerDevice(userId: string, device: Device): Promise<void>;
  listDevices(userId: string): Promise<ConnectedDevice[]>;
  getDevice(userId: string, deviceId: string): Promise<ConnectedDevice | undefined>;
  removeDevice(userId: string, deviceId: string): Promise<void>;
  getSyncHistory(userId: string): Promise<SyncHistoryEntry[]>;
  /** Two-phase sync: build preview (no writes) then confirmImport (writes). */
  syncDevice(userId: string, device: Device): Promise<SyncPreview>;
  confirmImport(userId: string, preview: SyncPreview): Promise<SyncResult>;
  /** Convenience: build preview + import immediately for a fresh device. */
  syncAndImport(userId: string, device: Device): Promise<SyncResult>;
}

export class DeviceIntegrationService implements DeviceIntegrationServiceInstance {
  constructor(private readonly manager: DeviceManager) {}

  getAvailableAdapters(): DeviceAdapter[] {
    return this.manager.list();
  }

  getSupportedAdapters(): DeviceAdapter[] {
    return this.manager.listSupported();
  }

  async discoverDevices(): Promise<Device[]> {
    return this.manager.discoverAll();
  }

  async discoverByAdapter(adapterId: string): Promise<Device[]> {
    return this.manager.discoverBy(adapterId);
  }

  async connect(device: Device): Promise<void> {
    await this.manager.connect(device);
  }

  async disconnect(): Promise<void> {
    await this.manager.disconnect();
  }

  async registerDevice(userId: string, device: Device): Promise<void> {
    await deviceRepository.register({
      ...device,
      userId,
      lastConnectedAt: new Date().toISOString(),
    });
  }

  async listDevices(userId: string): Promise<ConnectedDevice[]> {
    return deviceRepository.findByUser(userId);
  }

  async getDevice(
    userId: string,
    deviceId: string
  ): Promise<ConnectedDevice | undefined> {
    return deviceRepository.findById(userId, deviceId);
  }

  async removeDevice(userId: string, deviceId: string): Promise<void> {
    await deviceRepository.remove(userId, deviceId);
  }

  async getSyncHistory(userId: string): Promise<SyncHistoryEntry[]> {
    return deviceRepository.historyByUser(userId);
  }

  /**
   * Phase 1 — read the device, parse + normalize and build a deduplicated
   * preview WITHOUT writing anything. The user stays in control (§8 of plan).
   */
  async syncDevice(userId: string, device: Device): Promise<SyncPreview> {
    let measurements: DeviceMeasurement[];
    try {
      measurements = await this.manager.sync(device);
    } catch (error) {
      throw new DeviceError({
        code: error instanceof DeviceError ? error.code : "sync-failed",
        cause: error,
      });
    }

    const existing = await glucoseRepository.findByUser(userId);
    const existingKeys = new Set(
      existing.map((record) =>
        [
          `${device.adapterId}|${device.id}|${device.transport}`,
          record.measuredAt,
          "glucose",
          record.value,
        ].join("|")
      )
    );

    let duplicateCount = 0;
    const unique: DeviceMeasurement[] = [];
    for (const measurement of measurements) {
      const key = deviceMeasurementKey(measurement);
      if (existingKeys.has(key)) {
        duplicateCount++;
        continue;
      }
      existingKeys.add(key);
      unique.push(measurement);
    }

    const result = buildSyncResult({
      deviceId: device.id,
      measurements,
      unique,
      duplicateCount,
      erroredCount: measurements.length - unique.length - duplicateCount,
      message:
        unique.length === 0
          ? "Nenhum novo registro encontrado."
          : `${unique.length} novo(s) registro(s) encontrado(s).`,
    });

    return { device, result };
  }

  private buildOutcome(preview: SyncPreview): SyncOutcome {
    const glucoseRecords = preview.result.measurements
      .filter((m) => m.type === "glucose")
      .map((m) => measurementToGlucose(m));
    return { ...preview, glucoseRecords };
  }

  /**
   * Phase 2 — persist the previewed records (only glucose in MVP), update the
   * device registry last-sync timestamp and record the sync history entry.
   */
  async confirmImport(userId: string, preview: SyncPreview): Promise<SyncResult> {
    const outcome = this.buildOutcome(preview);
    let imported = 0;
    let errors = 0;
    for (const record of outcome.glucoseRecords) {
      try {
        await glucoseRepository.create(
          {
            userId,
            value: record.value,
            unit: "mg/dL",
            context: record.context,
            measuredAt: record.measuredAt,
            notes: record.notes,
          },
          { createdAt: record.createdAt, updatedAt: record.updatedAt }
        );
        imported++;
      } catch {
        errors++;
      }
    }

    const device: ConnectedDevice = {
      ...outcome.device,
      userId,
      lastSyncAt: new Date().toISOString(),
    };
    await deviceRepository.register(device);

    const entry: SyncHistoryEntry = {
      id: crypto.randomUUID(),
      userId,
      deviceId: device.id,
      deviceName: device.name,
      syncedAt: new Date().toISOString(),
      importedCount: imported,
      duplicateCount: outcome.result.duplicateCount,
      errorCount: errors,
      ok: errors === 0,
      message: errors > 0 ? "Alguns registros não puderam ser importados." : undefined,
    };
    await deviceRepository.addHistory(entry);

    return {
      ...outcome.result,
      newRecords: imported,
      message: `${imported} registro(s) importado(s).`,
    };
  }

  /**
   * Convenience wrapper that skips the explicit preview for flows where the
   * user has already confirmed (e.g. a quick re-sync button of a known device).
   * It still runs deduplication before writing.
   */
  async syncAndImport(userId: string, device: Device): Promise<SyncResult> {
    const preview = await this.syncDevice(userId, device);
    return this.confirmImport(userId, preview);
  }
}

export { DeviceError, toFriendlyMessage };
