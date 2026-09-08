/**
 * BaseGlucoseAdapter
 *
 * Skeleton shared by glucose device adapters (Bluetooth, Serial, future ones).
 * Implements the protocol-agnostic parts of `DeviceAdapter` — `parse()` via the
 * shared glucose protocol, and `sync()` (discover→connect→read→parse). Each
 * concrete adapter must implement the transport-specific `discover()`,
 * `connect()`, `disconnect()` and `read()`.
 */

import type {
  Device,
  RawDeviceData,
} from "../types/device.types";
import type {
  DeviceAdapter,
  ParsedDeviceData,
} from "./device-adapter";
import { parseGlucoseRawData } from "./glucose-protocol";
import { DeviceError } from "./device.errors";

export abstract class BaseGlucoseAdapter implements DeviceAdapter {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract isSupported(): boolean;
  abstract discover(): Promise<Device[]>;
  abstract connect(device: Device): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract read(): Promise<RawDeviceData>;

  /** Parse raw data through the shared glucose protocol parser. */
  parse(raw: RawDeviceData): ParsedDeviceData {
    return parseGlucoseRawData({
      raw,
      device: {
        id: this.getParsedDeviceId(),
        name: this.getParsedDeviceName(),
        manufacturer: this.getParsedManufacturer(),
        model: this.getParsedModel(),
      },
      transport: this.getTransport(),
      adapterId: this.id,
    });
  }

  /**
   * Full sync: connect (idempotent), read raw data and parse to measurements.
   * Connection is closed afterwards so the device is released.
   */
  async sync(device: Device): Promise<ParsedDeviceData> {
    this.assertSupported();
    await this.connect(device);
    try {
      const raw = await this.read();
      return this.parse(raw);
    } finally {
      await this.disconnect();
    }
  }

  protected assertSupported(): void {
    if (!this.isSupported()) {
      throw new DeviceError({ code: "unsupported-browser" });
    }
  }

  /** Transport for this adapter (used when parsing provenance). */
  protected abstract getTransport(): "bluetooth" | "serial";

  protected abstract getParsedDeviceId(): string;
  protected abstract getParsedDeviceName(): string;
  protected abstract getParsedManufacturer(): string | undefined;
  protected abstract getParsedModel(): string | undefined;
}
