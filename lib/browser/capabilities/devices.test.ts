import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
}));

import {
  bluetoothCapability,
  serialCapability,
  nfcCapability,
  fileSystemCapability,
  deviceBluetoothSupported,
  deviceSerialSupported,
  deviceNfcSupported,
  deviceFileSystemSupported,
} from "./devices";

describe("device capabilities", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("navigator", {});
    delete (globalThis as Record<string, unknown>).NDEFReader;
    delete (globalThis as Record<string, unknown>).showOpenFilePicker;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reports bluetooth support only when requestDevice exists", () => {
    vi.stubGlobal("navigator", { bluetooth: {} });
    expect(bluetoothCapability().supported).toBe(false);

    vi.stubGlobal("navigator", { bluetooth: { requestDevice: vi.fn() } });
    expect(bluetoothCapability().supported).toBe(true);
    expect(deviceBluetoothSupported()).toBe(true);
  });

  it("reports serial support only when getPorts exists", () => {
    vi.stubGlobal("navigator", { serial: {} });
    expect(serialCapability().supported).toBe(false);

    vi.stubGlobal("navigator", { serial: { getPorts: vi.fn() } });
    expect(serialCapability().supported).toBe(true);
    expect(deviceSerialSupported()).toBe(true);
  });

  it("reports nfc support only when NDEFReader is a function", () => {
    expect(nfcCapability().supported).toBe(false);

    (globalThis as Record<string, unknown>).NDEFReader = class MockNFC {};
    expect(nfcCapability().supported).toBe(true);
    expect(deviceNfcSupported()).toBe(true);
  });

  it("reports file-system support only when showOpenFilePicker exists", () => {
    expect(fileSystemCapability().supported).toBe(false);

    (globalThis as Record<string, unknown>).showOpenFilePicker = vi.fn();
    expect(fileSystemCapability().supported).toBe(true);
    expect(deviceFileSystemSupported()).toBe(true);
  });

  it("reports everything unsupported when globals are missing", () => {
    expect(bluetoothCapability().supported).toBe(false);
    expect(serialCapability().supported).toBe(false);
    expect(nfcCapability().supported).toBe(false);
    expect(fileSystemCapability().supported).toBe(false);
  });
});
