/**
 * Device Integrations (Sprint 9).
 *
 * Public surface for the device integration feature. UI components consume the
 * single `deviceIntegrationService` instance — never the adapters or IndexedDB
 * directly — which keeps a clean, vendor-agnostic boundary and prepares a
 * future AI/MCP surface.
 */

import { DeviceManager } from "./core/device-manager";
import { BluetoothAdapter } from "./bluetooth/bluetooth-adapter";
import { SerialAdapter } from "./serial/serial-adapter";
import { DeviceIntegrationService } from "./device-integration.service";

function createDeviceIntegrationService(): DeviceIntegrationService {
  const manager = new DeviceManager();
  // Registering an adapter makes it available; support is still gated at
  // runtime by each adapter's `isSupported()` (capability detection). A future
  // adapter (e.g. NFC or a vendor-specific one) is added by registering it here.
  manager.register(new BluetoothAdapter());
  manager.register(new SerialAdapter());
  return new DeviceIntegrationService(manager);
}

export const deviceIntegrationService = createDeviceIntegrationService();

export { DeviceManager } from "./core/device-manager";
export { DeviceIntegrationService } from "./device-integration.service";
export { DeviceError, toFriendlyMessage, defaultMessage } from "./core/device.errors";
export type { DeviceErrorCode, DeviceErrorInit } from "./core/device.errors";
export type { DeviceAdapter, ParsedDeviceData } from "./core/device-adapter";
export {
  measurementToGlucose,
  deviceMeasurementKey,
  buildSyncResult,
} from "./core/device-normalizer";
export {
  parseGlucoseEnvelope,
  envelopeToMeasurements,
  parseGlucoseRawData,
} from "./core/glucose-protocol";
export type {
  GlucoseProtocolEnvelope,
  GlucoseProtocolRecord,
} from "./core/glucose-protocol";
export type {
  Device,
  ConnectedDevice,
  DeviceType,
  DeviceTransport,
  DeviceMeasurement,
  RawDeviceData,
  SyncHistoryEntry,
  SyncResult,
} from "./types/device.types";
export type {
  DeviceIntegrationServiceInstance,
  SyncPreview,
  SyncOutcome,
} from "./device-integration.service";
