import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import { cameraService } from "./camera.service";

describe("cameraService", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    cameraService.stop();
  });

  describe("isSupported", () => {
    it("returns true when getUserMedia is available", () => {
      vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } });
      expect(cameraService.isSupported()).toBe(true);
    });

    it("returns false when navigator.mediaDevices is missing", () => {
      vi.stubGlobal("navigator", {});
      expect(cameraService.isSupported()).toBe(false);
    });
  });

  describe("isStreaming", () => {
    it("returns false when no stream is active", () => {
      expect(cameraService.isStreaming()).toBe(false);
    });
  });

  describe("start", () => {
    it("returns unsupported when getUserMedia is not available", async () => {
      vi.stubGlobal("navigator", {});
      const result = await cameraService.start();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("unsupported");
    });

    it("returns permission-denied when getUserMedia throws NotAllowedError", async () => {
      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(
            Object.assign(new Error("NotAllowedError"), {
              name: "NotAllowedError",
            })
          ),
        },
      });
      const result = await cameraService.start();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("permission-denied");
    });

    it("returns camera-unavailable when no camera is found", async () => {
      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(
            Object.assign(new Error("NotFoundError"), {
              name: "NotFoundError",
            })
          ),
        },
      });
      const result = await cameraService.start();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("camera-unavailable");
    });

    it("returns success when getUserMedia resolves", async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      });
      const result = await cameraService.start();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.stream).toBe(mockStream);
    });
  });

  describe("stop", () => {
    it("stops all tracks and clears stream", async () => {
      const stopTrack = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: stopTrack }],
      };
      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      });
      await cameraService.start();
      expect(cameraService.isStreaming()).toBe(true);
      cameraService.stop();
      expect(stopTrack).toHaveBeenCalled();
      expect(cameraService.isStreaming()).toBe(false);
    });
  });
});
