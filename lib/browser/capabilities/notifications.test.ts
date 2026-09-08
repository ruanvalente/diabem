import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import {
  notificationsCapability,
  notificationsSupported,
} from "./notifications";

describe("notificationsCapability", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Notification", { permission: "default" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns supported when Notification API is available", () => {
    const result = notificationsCapability();
    expect(result.supported).toBe(true);
  });

  it("returns unsupported when Notification API is missing", () => {
    delete (globalThis as Record<string, unknown>).Notification;
    const result = notificationsCapability();
    expect(result.supported).toBe(false);
  });
});

describe("notificationsSupported", () => {
  it("returns false when Notification API is missing", () => {
    vi.stubGlobal("window", globalThis);
    delete (globalThis as Record<string, unknown>).Notification;
    expect(notificationsSupported()).toBe(false);
  });

  it("returns true when Notification API is available", () => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Notification", { permission: "default" });
    expect(notificationsSupported()).toBe(true);
  });
});
