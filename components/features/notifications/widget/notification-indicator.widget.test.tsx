// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { deliveredNotificationLog } from "@/lib/notifications/delivered-notification-log";

let currentUser: { id: string } | null = { id: "user-a" };

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: () => ({ user: currentUser }),
}));

import { NotificationIndicator } from "./notification-indicator.widget";

describe("NotificationIndicator", () => {
  beforeEach(() => {
    currentUser = { id: "user-a" };
    deliveredNotificationLog.beginSession(currentUser.id);
  });

  it("links to the notification settings without a counter", () => {
    render(<NotificationIndicator />);

    const link = screen.getByRole("link", { name: "Notificações" });
    expect(link).toHaveAttribute("href", "/settings#notificacoes");
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows how many notifications were presented", () => {
    render(<NotificationIndicator />);

    act(() => {
      deliveredNotificationLog.recordFor("user-a");
      deliveredNotificationLog.recordFor("user-a");
      deliveredNotificationLog.recordFor("user-a");
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Notificações: 3 apresentadas nesta sessão",
      }),
    ).toBeInTheDocument();
  });

  it("uses the singular form for a single notification", () => {
    render(<NotificationIndicator />);

    act(() => {
      deliveredNotificationLog.recordFor("user-a");
    });

    expect(
      screen.getByRole("link", {
        name: "Notificações: 1 apresentada nesta sessão",
      }),
    ).toBeInTheDocument();
  });

  it("caps the visible counter at 99+", () => {
    render(<NotificationIndicator />);

    act(() => {
      for (let index = 0; index < 120; index += 1) {
        deliveredNotificationLog.recordFor("user-a");
      }
    });

    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Notificações: 120 apresentadas nesta sessão",
      }),
    ).toBeInTheDocument();
  });

  it("clears the counter when the session begins again", () => {
    render(<NotificationIndicator />);

    act(() => {
      deliveredNotificationLog.recordFor("user-a");
    });
    act(() => {
      deliveredNotificationLog.beginSession("user-a");
    });

    expect(screen.getByRole("link", { name: "Notificações" })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("does not render the previous session count for another user", () => {
    const { rerender } = render(<NotificationIndicator />);

    act(() => {
      deliveredNotificationLog.recordFor("user-a");
      deliveredNotificationLog.recordFor("user-a");
    });
    expect(screen.getByText("2")).toBeInTheDocument();

    // The new user renders before its session is announced, which is the window
    // where the previous count used to be exposed.
    currentUser = { id: "user-b" };
    rerender(<NotificationIndicator />);

    expect(screen.getByRole("link", { name: "Notificações" })).toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });
});
