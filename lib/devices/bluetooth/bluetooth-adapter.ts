/**
 * BluetoothAdapter
 *
 * Web Bluetooth adapter for glucose devices. It encapsulates ALL Web Bluetooth
 * knowledge (GATT services/characteristics, filters, pairing) so the domain and
 * UI never deal with `navigator.bluetooth`.
 *
 * The parser is shared (via BaseGlucoseAdapter) — this adapter only handles the
 * transport. Support is gated by `bluetoothCapability()`, so on browsers without
 * Web Bluetooth this adapter reports `isSupported() === false` and the UI can
 * present a graceful, non-blocking message.
 *
 * NOTE: actual device interaction requires a secure context and a user gesture
 * (enforced by the browser). Reading a full glucose history from a real device
 * is vendor-specific and beyond the MVP; this adapter models the connection
 * flow and shares a testable parser.
 */

import { BaseGlucoseAdapter } from "../core/base-glucose-adapter";
import { deviceBluetoothSupported } from "../../browser/capabilities/devices";
import { DeviceError } from "../core/device.errors";
import type {
  Device,
  RawDeviceData,
} from "../types/device.types";

/** Minimal structural typing for the Web Bluetooth device we interact with. */
type NativeBluetoothDevice = {
  id: string;
  name?: string;
  gatt?: {
    connect: () => Promise<{
      getPrimaryService: (uuid: string) => Promise<{
        getCharacteristic: (uuid: string) => Promise<{
          readValue: () => Promise<DataView>;
        }>;
      }>;
    }>;
  };
};

/** Glucose Profile GATT service / measurement characteristic (standard UUIDs). */
const GLUCOSE_SERVICE_UUID = "00001808-0000-1000-8000-00805f9b34fb";
const MEASUREMENT_CHAR_UUID = "00002a18-0000-1000-8000-00805f9b34fb";

export class BluetoothAdapter extends BaseGlucoseAdapter {
  readonly id = "bluetooth";
  readonly name = "Bluetooth";
  private nativeDevice: NativeBluetoothDevice | null = null;
  private currentDevice: Device | null = null;

  isSupported(): boolean {
    return deviceBluetoothSupported();
  }

  protected getTransport(): "bluetooth" {
    return "bluetooth";
  }

  protected getParsedDeviceId(): string {
    return this.currentDevice?.id ?? "unknown";
  }

  protected getParsedDeviceName(): string {
    return this.currentDevice?.name ?? "Dispositivo Bluetooth";
  }

  protected getParsedManufacturer(): string | undefined {
    return this.currentDevice?.manufacturer;
  }

  protected getParsedModel(): string | undefined {
    return this.currentDevice?.model;
  }

  async discover(): Promise<Device[]> {
    this.assertSupported();
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      throw new DeviceError({ code: "unsupported-browser" });
    }

    let native: NativeBluetoothDevice;
    try {
      native = (await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [GLUCOSE_SERVICE_UUID],
      })) as unknown as NativeBluetoothDevice;
    } catch {
      throw new DeviceError({ code: "permission-denied" });
    }

    this.nativeDevice = native;
    return [this.fromNative(native)];
  }

  async connect(device: Device): Promise<void> {
    this.assertSupported();
    this.currentDevice = device;
    // gatt.connect() is performed lazily in read(); keeping the device reference
    // here models the connection state without holding a duplicate GATT handle.
  }

  async disconnect(): Promise<void> {
    this.currentDevice = null;
    this.nativeDevice = null;
  }

  async read(): Promise<RawDeviceData> {
    if (!this.currentDevice || !this.nativeDevice) {
      throw new DeviceError({ code: "device-not-found" });
    }
    if (!this.nativeDevice.gatt) {
      throw new DeviceError({ code: "unsupported-device" });
    }

    try {
      const server = await this.nativeDevice.gatt.connect();
      const service = await server.getPrimaryService(GLUCOSE_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(MEASUREMENT_CHAR_UUID);
      const value = await characteristic.readValue();
      const bytes = new Uint8Array(value.buffer);
      return { format: "application/json", data: bytes };
    } catch {
      throw new DeviceError({ code: "connection-failed" });
    }
  }

  private fromNative(native: NativeBluetoothDevice): Device {
    return {
      id: crypto.randomUUID(),
      name: native.name ?? "Dispositivo Bluetooth",
      type: "glucose",
      transport: "bluetooth",
      adapterId: this.id,
      nativeId: native.id,
      lastConnectedAt: new Date().toISOString(),
    };
  }
}
