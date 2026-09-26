import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

const environment = vi.hoisted(() => ({ isBrowser: true, secure: true }));

vi.mock("../environment", () => ({
  get isBrowser() {
    return environment.isBrowser;
  },
  isSecureContext: () => environment.secure,
}));

import {
  notificationPermissionState,
  notificationsCapability,
  notificationsSupported,
} from "./notifications";

describe("notificationsCapability", () => {
  beforeEach(() => {
    environment.isBrowser = true;
    environment.secure = true;
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Notification", { permission: "default" });
  });

  afterEach(() => {
    environment.isBrowser = true;
    environment.secure = true;
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

describe("notification scheduling capability", () => {
  beforeEach(() => {
    environment.isBrowser = true;
    environment.secure = true;
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Notification", { permission: "default" });
  });

  afterEach(() => {
    environment.isBrowser = true;
    environment.secure = true;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("disables every capability outside the browser", () => {
    environment.isBrowser = false;

    const result = notificationsCapability();

    expect(result).toEqual({
      supported: false,
      secureContext: false,
      serviceWorker: false,
      scheduling: { reliableBackgroundDelivery: false },
    });
  });

  it("detects Notifications and Service Worker in a secure context", () => {
    vi.stubGlobal("navigator", { serviceWorker: {} });

    const result = notificationsCapability();

    expect(result).toMatchObject({
      supported: true,
      secureContext: true,
      serviceWorker: true,
      scheduling: { reliableBackgroundDelivery: false },
    });
  });

  it("reports unsupported in an insecure context even with the API present", () => {
    // The Notifications API is only usable over HTTPS (or localhost). Reporting
    // it as supported on an insecure origin is what produced a dead "activate
    // notifications" button in the settings screen.
    environment.secure = false;
    vi.stubGlobal("navigator", { serviceWorker: {} });

    const result = notificationsCapability();

    expect(result.secureContext).toBe(false);
    expect(result.supported).toBe(false);
    expect(result.serviceWorker).toBe(false);
    expect(notificationsSupported()).toBe(false);
    expect(notificationPermissionState()).toBe("unsupported");
  });

  it("never claims reliable background delivery", () => {
    // Notification Triggers are gone from shipping browsers and Push needs a
    // server, so the app cannot deliver with itself closed. The field is
    // reported so the settings screen can disclose that instead of assuming it.
    const result = notificationsCapability();

    expect(result.scheduling).toEqual({ reliableBackgroundDelivery: false });
  });

  it("still reports the limitation when the discontinued trigger APIs are present", () => {
    // The trigger probe used to switch the strategy to "notification-triggers"
    // without changing any behaviour. Stubs emulate a browser that briefly
    // exposed them, so the limitation cannot be hidden by their presence.
    vi.stubGlobal("Notification", {
      permission: "default",
      showTrigger: {},
    });
    vi.stubGlobal("getNotificationCapabilities", vi.fn());

    const result = notificationsCapability();

    expect(result.supported).toBe(true);
    expect(result.scheduling).toEqual({ reliableBackgroundDelivery: false });
  });

  it("returns unsupported without the Notification API", () => {
    delete (globalThis as Record<string, unknown>).Notification;

    expect(notificationPermissionState()).toBe("unsupported");
  });
});
