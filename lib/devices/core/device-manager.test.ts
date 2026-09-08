import { describe, it, expect, vi } from "vitest";
import { DeviceManager } from "./device-manager";
import { DeviceError } from "./device.errors";
import type { DeviceAdapter, ParsedDeviceData } from "./device-adapter";
import type { Device, DeviceMeasurement } from "../types/device.types";

function mockAdapter(overrides: Partial<DeviceAdapter> = {}): DeviceAdapter {
  return {
    id: "test",
    name: "Test",
    isSupported: () => true,
    discover: vi.fn().mockResolvedValue([]),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue({ format: "text/plain", data: "{}" }),
    parse: (): ParsedDeviceData => ({
      measurements: [],
      droppedCount: 0,
    }),
    sync: vi.fn().mockResolvedValue([] as DeviceMeasurement[]),
    ...overrides,
  };
}

const DEVICE: Device = {
  id: "dev-1",
  name: "Glicosímetro",
  type: "glucose",
  transport: "test" as Device["transport"],
  adapterId: "test",
};

describe("DeviceManager", () => {
  it("registers, lists and unregisters adapters", () => {
    const manager = new DeviceManager();
    const adapter = mockAdapter();
    manager.register(adapter);
    expect(manager.has("test")).toBe(true);
    expect(manager.list()).toEqual([adapter]);
    expect(manager.unregister("test")).toBe(true);
    expect(manager.has("test")).toBe(false);
  });

  it("lists only supported adapters", () => {
    const manager = new DeviceManager();
    manager.register(mockAdapter({ id: "a", isSupported: () => true }));
    manager.register(mockAdapter({ id: "b", isSupported: () => false }));
    expect(manager.listSupported().map((a) => a.id)).toEqual(["a"]);
  });

  it("throws unsupported-browser for an unknown adapter", () => {
    const manager = new DeviceManager();
    expect(() => manager.get("missing")).toThrow(DeviceError);
  });

  it("discoverAll skips failed and unsupported adapters", async () => {
    const manager = new DeviceManager();
    manager.register(
      mockAdapter({ id: "ok", discover: vi.fn().mockResolvedValue([DEVICE]) })
    );
    manager.register(
      mockAdapter({
        id: "bad",
        discover: vi.fn().mockRejectedValue(new Error("boom")),
      })
    );
    const devices = await manager.discoverAll();
    expect(devices).toEqual([DEVICE]);
  });

  it("discoverBy throws unsupported-browser when adapter is not supported", async () => {
    const manager = new DeviceManager();
    manager.register(mockAdapter({ id: "a", isSupported: () => false }));
    await expect(manager.discoverBy("a")).rejects.toThrow(
      expect.objectContaining({ code: "unsupported-browser" })
    );
  });

  it("discoverBy delegates to the adapter", async () => {
    const manager = new DeviceManager();
    const discover = vi.fn().mockResolvedValue([DEVICE]);
    manager.register(mockAdapter({ id: "a", discover }));
    const devices = await manager.discoverBy("a");
    expect(discover).toHaveBeenCalledOnce();
    expect(devices).toEqual([DEVICE]);
  });

  it("connect tracks the active adapter and disconnect tears it down", async () => {
    const manager = new DeviceManager();
    const connect = vi.fn().mockResolvedValue(undefined);
    const disconnect = vi.fn().mockResolvedValue(undefined);
    manager.register(mockAdapter({ id: "a", connect, disconnect }));
    await manager.connect({ ...DEVICE, adapterId: "a" });
    expect(connect).toHaveBeenCalledWith({ ...DEVICE, adapterId: "a" });
    await manager.disconnect();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("sync delegates to the adapter and returns measurements", async () => {
    const manager = new DeviceManager();
    const measurement: DeviceMeasurement = {
      type: "glucose",
      value: 100,
      unit: "mg/dL",
      measuredAt: "2026-09-01T08:00:00Z",
      source: { deviceId: "dev-1", transport: "test" as never, adapterId: "test" },
    };
    const sync = vi.fn().mockResolvedValue([measurement]);
    manager.register(mockAdapter({ id: "test", sync }));
    const result = await manager.sync(DEVICE);
    expect(result).toEqual([measurement]);
  });
});
