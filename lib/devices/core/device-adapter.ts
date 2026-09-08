/**
 * The DeviceAdapter contract.
 *
 * This is the most important architectural piece of the device integration
 * feature. Every transport/family (Bluetooth, Serial, and future ones) is
 * implemented as an adapter that satisfies this contract. The domain and the UI
 * depend only on this interface — never on a vendor or protocol.
 *
 * Adapters encapsulate ALL vendor/protocol knowledge (GATT services,
 * characteristics, serial framing, authentication, data formats).
 */

import type {
  Device,
  DeviceMeasurement,
  RawDeviceData,
} from "../types/device.types";

/**
 * Result of parsing + normalizing raw device data into measurements.
 */
export type ParsedDeviceData = {
  measurements: DeviceMeasurement[];
  /** Number of records dropped because they couldn't be parsed. */
  droppedCount: number;
};

/**
 * Contract every device adapter must satisfy.
 */
export interface DeviceAdapter {
  /** Unique adapter id used in the registry (e.g. "bluetooth", "serial"). */
  readonly id: string;
  /** Human-friendly adapter name. */
  readonly name: string;
  /** Whether this adapter/transport is usable in the current environment. */
  isSupported(): boolean;
  /** List devices currently discoverable via this adapter. */
  discover(): Promise<Device[]>;
  /** Establish a connection to the given device. */
  connect(device: Device): Promise<void>;
  /** Tear down the current connection. */
  disconnect(): Promise<void>;
  /** Read raw (unparsed) data from the connected device. */
  read(): Promise<RawDeviceData>;
  /** Parse + normalize raw data into neutral `DeviceMeasurement` records. */
  parse(raw: RawDeviceData): ParsedDeviceData;
  /** Convenience: discover → select → connect → read → parse in one step. */
  sync(device: Device): Promise<DeviceMeasurement[]>;
}
