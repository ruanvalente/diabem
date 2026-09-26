import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

const environment = { isBrowser: true, secure: true };

vi.mock("../environment", () => ({
  get isBrowser() {
    return environment.isBrowser;
  },
  isSecureContext: () => environment.secure,
}));

import { notificationsSupported } from "../capabilities/notifications";
import { notificationService } from "./notification.service";

describe("notificationService", () => {
  beforeEach(() => {
    environment.isBrowser = true;
    environment.secure = true;
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

    it("agrees with the capability detection on an insecure context", () => {
      // The service and the UI must never disagree: when they did, the settings
      // screen offered an "activate" button that could not work.
      environment.secure = false;

      expect(notificationService.isSupported()).toBe(false);
      expect(notificationsSupported()).toBe(false);
    });

    it("agrees with the capability detection during SSR", () => {
      environment.isBrowser = false;

      expect(notificationService.isSupported()).toBe(false);
      expect(notificationsSupported()).toBe(false);
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

  describe("show", () => {
    it("returns fallback when permission is not granted", async () => {
      vi.stubGlobal("Notification", { permission: "default" });
      const result = await notificationService.show({ title: "Test" });
      expect(result.ok).toBe(false);
      if (!result.ok && "fallback" in result) expect(result.fallback).toBe(true);
    });

    it("returns fallback when Notification API is missing", async () => {
      delete (globalThis as Record<string, unknown>).Notification;
      const result = await notificationService.show({ title: "Test" });
      expect(result.ok).toBe(false);
      if (!result.ok && "fallback" in result) expect(result.fallback).toBe(true);
    });
  });
});

describe("show with Service Worker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Notification", { permission: "granted" });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function createRegistrationHarness() {
    const showNotification =
      vi.fn<(title: string, options?: NotificationOptions) => Promise<void>>();
    const getNotifications =
      vi.fn<(filter?: { tag?: string }) => Promise<Notification[]>>();
    const registration = {
      showNotification,
      getNotifications,
    } as unknown as ServiceWorkerRegistration;
    const getRegistration =
      vi.fn<() => Promise<ServiceWorkerRegistration | undefined>>();

    showNotification.mockResolvedValue(undefined);
    getNotifications.mockResolvedValue([]);
    getRegistration.mockResolvedValue(registration);
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });

    return { registration, showNotification, getNotifications, getRegistration };
  }

  it("uses the Service Worker when a registration and granted permission exist", async () => {
    const harness = createRegistrationHarness();

    const result = await notificationService.show({
      title: "Lembrete",
      body: "Registre seus dados",
      tag: "diabem-reminder-schedule-1",
      url: "/glucose",
    });

    expect(harness.getRegistration).toHaveBeenCalledTimes(1);
    expect(harness.showNotification).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, transport: "service-worker" });
  });

  it("replaces an external URL with the dashboard and keeps an allowed internal route", async () => {
    const harness = createRegistrationHarness();

    await notificationService.show({
      title: "Lembrete externo",
      url: "https://example.com/glucose",
    });
    await notificationService.show({
      title: "Lembrete interno",
      url: "/glucose",
    });

    expect(harness.showNotification).toHaveBeenNthCalledWith(
      1,
      "Lembrete externo",
      expect.objectContaining({ data: { url: "/dashboard" } }),
    );
    expect(harness.showNotification).toHaveBeenNthCalledWith(
      2,
      "Lembrete interno",
      expect.objectContaining({ data: { url: "/glucose" } }),
    );
  });

  it("uses the constructor when there is no Service Worker registration", async () => {
    const close = vi.fn();
    const NotificationConstructor = vi.fn(function MockNotification(
      this: { close: typeof close },
    ) {
      this.close = close;
    }) as unknown as typeof Notification;
    Object.defineProperty(NotificationConstructor, "permission", {
      configurable: true,
      value: "granted",
    });
    vi.stubGlobal("Notification", NotificationConstructor);
    const getRegistration =
      vi.fn<() => Promise<ServiceWorkerRegistration | undefined>>().mockResolvedValue(
        undefined,
      );
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });

    const result = await notificationService.show({ title: "Lembrete" });

    expect(getRegistration).toHaveBeenCalledTimes(1);
    expect(NotificationConstructor).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, transport: "constructor" });
  });

  it("handles the click on the constructor transport", async () => {
    const close = vi.fn();
    const focus = vi.fn();
    const instances: { onclick: (() => void) | null }[] = [];
    vi.stubGlobal("focus", focus);
    const NotificationConstructor = vi.fn(function MockNotification(
      this: { close: typeof close; onclick: (() => void) | null },
    ) {
      this.close = close;
      this.onclick = null;
      instances.push(this);
    }) as unknown as typeof Notification;
    Object.defineProperty(NotificationConstructor, "permission", {
      configurable: true,
      value: "granted",
    });
    vi.stubGlobal("Notification", NotificationConstructor);
    vi.stubGlobal("navigator", {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue(undefined) },
    });

    await notificationService.show({ title: "Lembrete" });

    // Without a Service Worker there is no notificationclick handler, so the
    // notification must at least focus the window and dismiss itself.
    expect(instances).toHaveLength(1);
    expect(instances[0].onclick).toBeTypeOf("function");
    instances[0].onclick?.();
    expect(focus).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("returns permission-denied when permission is denied", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });

    const result = await notificationService.show({ title: "Lembrete" });

    expect(result).toEqual({
      ok: false,
      reason: "permission-denied",
      fallback: true,
    });
  });

  it("closes only the notifications with the given tag", async () => {
    const harness = createRegistrationHarness();
    const matchingClose = vi.fn();
    const otherClose = vi.fn();
    const matching = { close: matchingClose } as unknown as Notification;
    const other = { close: otherClose } as unknown as Notification;
    harness.getNotifications.mockImplementation(async (filter) =>
      filter?.tag === "target" ? [matching] : [matching, other],
    );

    const result = await notificationService.close("target");

    expect(harness.getNotifications).toHaveBeenCalledWith({ tag: "target" });
    expect(matchingClose).toHaveBeenCalledTimes(1);
    expect(otherClose).not.toHaveBeenCalled();
    expect(result).toBe(1);
  });

  it("closes every notification and returns the count", async () => {
    const harness = createRegistrationHarness();
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    const first = { close: firstClose } as unknown as Notification;
    const second = { close: secondClose } as unknown as Notification;
    harness.getNotifications.mockResolvedValue([first, second]);

    const result = await notificationService.closeAll();

    expect(harness.getNotifications).toHaveBeenCalledWith();
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(secondClose).toHaveBeenCalledTimes(1);
    expect(result).toBe(2);
  });
});
