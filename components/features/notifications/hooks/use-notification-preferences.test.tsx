// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/notifications/notification-scheduler.service", () => ({
  getNotificationScheduler: () => ({
    schedule: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
  }),
}));

import { useNotificationPreferences } from "./use-notification-preferences";
import { getDatabase } from "@/lib/db/database";
import { notificationScheduleRepository } from "@/lib/db/repositories/notification-schedule.repository";

beforeEach(async () => {
  const database = getDatabase();
  await database.notificationSchedules.clear();
  await database.notificationPreferences.clear();
});

describe("useNotificationPreferences", () => {
  it("creates the default preferences on first read", async () => {
    const { result } = renderHook(() => useNotificationPreferences("user-a"));

    await waitFor(() => expect(result.current.preferences).not.toBeNull());
    expect(result.current.preferences?.enabled).toBe(false);
    expect(result.current.preferences?.quietHours).toEqual({
      enabled: false,
      start: "22:00",
      end: "07:00",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("persists the silent window and the master switch", async () => {
    const { result } = renderHook(() => useNotificationPreferences("user-a"));
    await waitFor(() => expect(result.current.preferences).not.toBeNull());

    await act(async () => {
      const saved = await result.current.save({
        enabled: true,
        quietHours: { enabled: true, start: "23:00", end: "06:00" },
      });
      expect(saved.ok).toBe(true);
    });

    expect(result.current.preferences?.enabled).toBe(true);
    expect(result.current.preferences?.quietHours.start).toBe("23:00");
    const stored = await getDatabase().notificationPreferences.get("user-a");
    expect(stored?.quietHours.end).toBe("06:00");
  });

  it("surfaces validation errors for an invalid silent window", async () => {
    const { result } = renderHook(() => useNotificationPreferences("user-a"));
    await waitFor(() => expect(result.current.preferences).not.toBeNull());

    const saved = await result.current.save({
      enabled: true,
      quietHours: { enabled: true, start: "9:00", end: "06:00" },
    });

    expect(saved.ok).toBe(false);
    if (!saved.ok) expect(saved.error).toMatch(/HH:MM/);
  });

  it("refuses to save without a session", async () => {
    const { result } = renderHook(() => useNotificationPreferences(null));

    const saved = await result.current.save({
      enabled: true,
      quietHours: { enabled: false, start: "22:00", end: "07:00" },
    });

    expect(saved.ok).toBe(false);
    expect(await getDatabase().notificationPreferences.count()).toBe(0);
  });

  it("does not leak another user's preferences into the form", async () => {
    await notificationScheduleRepository.updatePreferences("user-b", {
      enabled: true,
      quietHours: { enabled: true, start: "21:00", end: "05:00" },
    });

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string | null }) => useNotificationPreferences(userId),
      { initialProps: { userId: "user-b" as string | null } },
    );
    await waitFor(() => expect(result.current.preferences?.enabled).toBe(true));

    rerender({ userId: "user-a" });
    await waitFor(() => expect(result.current.preferences?.enabled).toBe(false));
  });
});
