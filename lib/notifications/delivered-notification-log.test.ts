import { describe, expect, it, vi } from "vitest";
import { createDeliveredNotificationLog } from "./delivered-notification-log";

describe("createDeliveredNotificationLog", () => {
  it("reads zero before any session begins", () => {
    expect(createDeliveredNotificationLog().getCountFor("user-1")).toBe(0);
  });

  it("counts every delivery recorded during the session", () => {
    const log = createDeliveredNotificationLog();
    log.beginSession("user-1");

    log.recordFor("user-1");
    log.recordFor("user-1");
    log.recordFor("user-1");

    expect(log.getCountFor("user-1")).toBe(3);
  });

  it("does not expose the count to a different user", () => {
    const log = createDeliveredNotificationLog();
    log.beginSession("user-1");
    log.recordFor("user-1");

    expect(log.getCountFor("user-2")).toBe(0);
    expect(log.getCountFor(null)).toBe(0);
  });

  it("hides the previous session from the next user before it is announced", () => {
    const log = createDeliveredNotificationLog();
    log.beginSession("user-1");
    log.recordFor("user-1");
    log.recordFor("user-1");

    // Sign-out and sign-in happen across a navigation that keeps this module
    // alive, so the new user reads before its session is announced.
    expect(log.getCountFor("user-2")).toBe(0);

    log.beginSession("user-2");
    expect(log.getCountFor("user-2")).toBe(0);
  });

  it("notifies subscribers when a delivery is recorded", () => {
    const log = createDeliveredNotificationLog();
    const listener = vi.fn();
    log.beginSession("user-1");
    log.subscribe(listener);

    log.recordFor("user-1");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("drops a delivery that resolves after the session changed", () => {
    const log = createDeliveredNotificationLog();
    log.beginSession("user-1");
    log.recordFor("user-1");

    log.beginSession("user-2");
    // A delivery scheduled for user-1 resolves late and must not be credited
    // to the user that opened the application next.
    log.recordFor("user-1");

    expect(log.getCountFor("user-2")).toBe(0);
  });

  it("drops a delivery recorded before any session begins", () => {
    const log = createDeliveredNotificationLog();

    log.recordFor("user-1");

    log.beginSession("user-1");
    expect(log.getCountFor("user-1")).toBe(0);
  });

  it("notifies subscribers when a session begins", () => {
    const log = createDeliveredNotificationLog();
    const listener = vi.fn();
    log.beginSession("user-1");
    log.recordFor("user-1");
    log.subscribe(listener);

    log.beginSession("user-1");

    expect(log.getCountFor("user-1")).toBe(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying unsubscribed listeners", () => {
    const log = createDeliveredNotificationLog();
    const listener = vi.fn();
    log.beginSession("user-1");
    const unsubscribe = log.subscribe(listener);

    unsubscribe();
    log.recordFor("user-1");

    expect(listener).not.toHaveBeenCalled();
    expect(log.getCountFor("user-1")).toBe(1);
  });
});
