import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import { cameraCapability, cameraSupported } from "./camera";

describe("cameraCapability", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns supported when getUserMedia is available", () => {
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } });
    expect(cameraCapability().supported).toBe(true);
  });

  it("returns unsupported when navigator.mediaDevices is missing", () => {
    vi.stubGlobal("navigator", {});
    expect(cameraCapability().supported).toBe(false);
  });

  it("returns unsupported when getUserMedia is not a function", () => {
    vi.stubGlobal("navigator", { mediaDevices: {} });
    expect(cameraCapability().supported).toBe(false);
  });
});

describe("cameraSupported", () => {
  it("returns false when navigator.mediaDevices is missing", () => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("navigator", {});
    expect(cameraSupported()).toBe(false);
  });

  it("returns true when getUserMedia is available", () => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } });
    expect(cameraSupported()).toBe(true);
  });
});
