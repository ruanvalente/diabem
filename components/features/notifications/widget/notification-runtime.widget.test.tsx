// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

let currentUser: { id: string } | null = { id: "user-a" };

const mocks = vi.hoisted(() => ({
  beginSession: vi.fn(),
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  reload: vi.fn(async () => {}),
}));

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock("@/lib/notifications/delivered-notification-log", () => ({
  deliveredNotificationLog: { beginSession: mocks.beginSession },
}));

vi.mock("@/lib/notifications/notification-scheduler.service", () => ({
  getNotificationScheduler: () => ({
    start: mocks.start,
    stop: mocks.stop,
    reload: mocks.reload,
  }),
}));

import { NotificationRuntime } from "./notification-runtime.widget";

function setVisibilityState(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

describe("NotificationRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: "user-a" };
    setVisibilityState("visible");
  });

  afterEach(() => {
    setVisibilityState("visible");
  });

  it("renders nothing", () => {
    const { container } = render(<NotificationRuntime />);

    expect(container).toBeEmptyDOMElement();
  });

  it("starts the scheduler and announces the delivery session", () => {
    render(<NotificationRuntime />);

    expect(mocks.beginSession).toHaveBeenCalledWith("user-a");
    expect(mocks.start).toHaveBeenCalledWith("user-a");
    expect(mocks.stop).not.toHaveBeenCalled();
  });

  it("does nothing without an authenticated session", () => {
    currentUser = null;
    render(<NotificationRuntime />);

    expect(mocks.beginSession).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("restarts the runtime when the user changes", () => {
    const { rerender } = render(<NotificationRuntime />);

    currentUser = { id: "user-b" };
    rerender(<NotificationRuntime />);

    expect(mocks.start).toHaveBeenLastCalledWith("user-b");
  });

  it("reloads the reminders when the document becomes visible again", () => {
    render(<NotificationRuntime />);

    setVisibilityState("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mocks.reload).not.toHaveBeenCalled();

    setVisibilityState("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mocks.reload).toHaveBeenCalledTimes(1);
  });

  it("stops the scheduler and drops the listener on unmount", () => {
    const { unmount } = render(<NotificationRuntime />);
    unmount();

    expect(mocks.stop).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new Event("visibilitychange"));
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it("stops the scheduler when the session ends", () => {
    const { rerender } = render(<NotificationRuntime />);

    currentUser = null;
    rerender(<NotificationRuntime />);

    expect(mocks.stop).toHaveBeenCalledTimes(1);
  });
});