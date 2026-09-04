import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import { notificationService } from "./notification.service";

describe("notificationService", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Notification", { permission: "default" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("isSupported", () => {
    it("returns true when Notification API is available", () => {
      expect(notificationService.isSupported()).toBe(true);
    });

    it("returns false when Notification API is missing", () => {
      delete (globalThis as Record<string, unknown>).Notification;
      expect(notificationService.isSupported()).toBe(false);
    });
  });

  describe("getPermission", () => {
    it("returns the current Notification.permission", () => {
      vi.stubGlobal("Notification", { permission: "granted" });
      expect(notificationService.getPermission()).toBe("granted");
    });

    it("returns default when permission is default", () => {
      vi.stubGlobal("Notification", { permission: "default" });
      expect(notificationService.getPermission()).toBe("default");
    });

    it("returns unsupported when Notification API is missing", () => {
      delete (globalThis as Record<string, unknown>).Notification;
      expect(notificationService.getPermission()).toBe("unsupported");
    });
  });

  describe("requestPermission", () => {
    it("returns granted when user accepts", async () => {
      vi.stubGlobal("Notification", {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      });
      const result = await notificationService.requestPermission();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.permission).toBe("granted");
    });

    it("returns permission-denied when user rejects", async () => {
      vi.stubGlobal("Notification", {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("denied"),
      });
      const result = await notificationService.requestPermission();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("permission-denied");
    });

    it("returns unsupported when Notification API is missing", async () => {
      delete (globalThis as Record<string, unknown>).Notification;
      const result = await notificationService.requestPermission();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("unsupported");
    });
  });

  describe("notify", () => {
    it("returns fallback when permission is not granted", async () => {
      vi.stubGlobal("Notification", { permission: "default" });
      const result = await notificationService.notify({ title: "Test" });
      expect(result.ok).toBe(false);
      if (!result.ok && "fallback" in result) expect(result.fallback).toBe(true);
    });

    it("returns fallback when Notification API is missing", async () => {
      delete (globalThis as Record<string, unknown>).Notification;
      const result = await notificationService.notify({ title: "Test" });
      expect(result.ok).toBe(false);
      if (!result.ok && "fallback" in result) expect(result.fallback).toBe(true);
    });
  });
});
