/**
 * SerialAdapter
 *
 * Web Serial adapter for devices that show up as a USB/serial port. It
 * encapsulates all Web Serial knowledge (port enumeration, open, read, loop) so
 * the domain and UI never touch `navigator.serial`.
 *
 * The parser is shared (via BaseGlucoseAdapter). Support is gated by
 * `serialCapability()`. As with Bluetooth, real protocol/device behavior is
 * vendor-specific and out of MVP scope; this models the connection flow over a
 * testable parser.
 */

import { BaseGlucoseAdapter } from "../core/base-glucose-adapter";
import { deviceSerialSupported } from "../../browser/capabilities/devices";
import { DeviceError } from "../core/device.errors";
import type {
  Device,
  RawDeviceData,
} from "../types/device.types";

/** Minimal structural typing for the Web Serial API surface we use. */
type NativeSerialPortWrapper = {
  id: string;
  open: (options: { baudRate: number }) => Promise<void>;
  readable?: {
    getReader: () => {
      read: () => Promise<{ value?: Uint8Array; done: boolean }>;
      releaseLock: () => void;
    };
  };
  close: () => Promise<void>;
};

const DEFAULT_BAUD_RATE = 19200;

export class SerialAdapter extends BaseGlucoseAdapter {
  readonly id = "serial";
  readonly name = "USB / Serial";
  private port: NativeSerialPortWrapper | null = null;
  private currentDevice: Device | null = null;

  isSupported(): boolean {
    return deviceSerialSupported();
  }

  protected getTransport(): "serial" {
    return "serial";
  }

  protected getParsedDeviceId(): string {
    return this.currentDevice?.id ?? "unknown";
  }

  protected getParsedDeviceName(): string {
    return this.currentDevice?.name ?? "Dispositivo Serial";
  }

  protected getParsedManufacturer(): string | undefined {
    return this.currentDevice?.manufacturer;
  }

  protected getParsedModel(): string | undefined {
    return this.currentDevice?.model;
  }

  async discover(): Promise<Device[]> {
    this.assertSupported();
    if (typeof navigator === "undefined" || !navigator.serial) {
      throw new DeviceError({ code: "unsupported-browser" });
    }

    let port: NativeSerialPortWrapper;
    try {
      port = (await navigator.serial.requestPort()) as unknown as NativeSerialPortWrapper;
    } catch {
      throw new DeviceError({ code: "permission-denied" });
    }

    this.port = port;
    return [this.fromNative(port)];
  }

  async connect(device: Device): Promise<void> {
    this.assertSupported();
    if (!this.port) {
      throw new DeviceError({ code: "device-not-found" });
    }
    try {
      await this.port.open({ baudRate: DEFAULT_BAUD_RATE });
    } catch {
      throw new DeviceError({ code: "connection-failed" });
    }
    this.currentDevice = device;
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // best-effort close
      }
    }
    this.port = null;
    this.currentDevice = null;
  }

  async read(): Promise<RawDeviceData> {
    if (!this.port || !this.currentDevice) {
      throw new DeviceError({ code: "device-not-found" });
    }
    if (!this.port.readable) {
      throw new DeviceError({ code: "connection-lost" });
    }

    const reader = this.port.readable.getReader();
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
        // Simple MVP: read a bounded window so we never spin forever.
        if (chunks.length >= 64) break;
      }
    } finally {
      reader.releaseLock();
    }

    if (chunks.length === 0) {
      throw new DeviceError({ code: "invalid-data" });
    }

    const merged = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return { format: "application/json", data: merged };
  }

  private fromNative(native: NativeSerialPortWrapper): Device {
    return {
      id: crypto.randomUUID(),
      name: native.id || "Dispositivo Serial",
      type: "glucose",
      transport: "serial",
      adapterId: this.id,
      nativeId: native.id,
      lastConnectedAt: new Date().toISOString(),
    };
  }
}
