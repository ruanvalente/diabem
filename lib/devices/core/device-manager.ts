/**
 * DeviceManager
 *
 * Owns the set of registered `DeviceAdapter`s and the runtime connection
 * state. The UI / service ask the manager to discover devices through all
 * supported adapters and to connect via a specific adapter. The manager keeps
 * adapters decoupled from each other and from the rest of the application.
 *
 * Adding a new transport (e.g. NFC or a new vendor) is a matter of registering
 * another adapter here without touching the domain or existing features.
 */

import type { DeviceAdapter } from "./device-adapter";
import type { Device, DeviceMeasurement } from "../types/device.types";
import { DeviceError } from "./device.errors";

export class DeviceManager {
  private adapters = new Map<string, DeviceAdapter>();
  private currentAdapterId: string | null = null;

  register(adapter: DeviceAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /** Unregister an adapter by id (returns false if it was not registered). */
  unregister(adapterId: string): boolean {
    return this.adapters.delete(adapterId);
  }

  has(adapterId: string): boolean {
    return this.adapters.has(adapterId);
  }

  list(): DeviceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /** Adapters that are usable in the current environment. */
  listSupported(): DeviceAdapter[] {
    return this.list().filter((adapter) => adapter.isSupported());
  }

  get(adapterId: string): DeviceAdapter {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new DeviceError({
        code: "unsupported-browser",
        message:
          "Este tipo de dispositivo não está registrado. Ele não foi adicionado aos adapters disponíveis.",
      });
    }
    return adapter;
  }

  /**
   * Discover devices across all supported adapters. Adapters that are not
   * supported, or that fail during discovery, are skipped gracefully so one
   * failing transport never blocks the others.
   */
  async discoverAll(): Promise<Device[]> {
    const results = await Promise.allSettled(
      this.listSupported().map((adapter) => adapter.discover())
    );
    return results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );
  }

  /**
   * Discover devices through a single adapter.
   */
  async discoverBy(adapterId: string): Promise<Device[]> {
    const adapter = this.get(adapterId);
    if (!adapter.isSupported()) {
      throw new DeviceError({ code: "unsupported-browser" });
    }
    return adapter.discover();
  }

  /**
   * Connect to a device via the adapter declared on the device. Tracks the
   * active connection so `disconnect()` can always tear it down.
   */
  async connect(device: Device): Promise<void> {
    const adapter = this.get(device.adapterId);
    if (!adapter.isSupported()) {
      throw new DeviceError({ code: "unsupported-browser" });
    }
    await adapter.connect(device);
    this.currentAdapterId = adapter.id;
  }

  async disconnect(): Promise<void> {
    if (!this.currentAdapterId) return;
    const adapter = this.get(this.currentAdapterId);
    await adapter.disconnect();
    this.currentAdapterId = null;
  }

  /**
   * Perform a full sync (discover happens before, connect is optional) for a
   * device, returning neutral measurements.
   */
  async sync(device: Device): Promise<DeviceMeasurement[]> {
    const adapter = this.get(device.adapterId);
    if (!adapter.isSupported()) {
      throw new DeviceError({ code: "unsupported-browser" });
    }
    return adapter.sync(device);
  }
}

export { DeviceError };
