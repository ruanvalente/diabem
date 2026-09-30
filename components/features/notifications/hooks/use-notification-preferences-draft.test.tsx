// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import type { NotificationPreferences } from "@/lib/notifications/types";
import { useNotificationPreferencesDraft } from "./use-notification-preferences-draft";

function preferences(
  overrides: Partial<NotificationPreferences> = {},
): NotificationPreferences {
  return {
    userId: "user-a",
    enabled: false,
    quietHours: { enabled: false, start: "22:00", end: "07:00" },
    timeZone: "America/Belem",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("useNotificationPreferencesDraft", () => {
  it("is not dirty and shows the creation defaults without a record", () => {
    const { result } = renderHook(() => useNotificationPreferencesDraft(null));

    expect(result.current.draft).toEqual({
      enabled: false,
      quietHours: { enabled: false, start: "22:00", end: "07:00" },
    });
    expect(result.current.isDirty).toBe(false);
  });

  it("mirrors the persisted record and stays clean", () => {
    const record = preferences({
      enabled: true,
      quietHours: { enabled: true, start: "23:00", end: "06:00" },
    });
    const { result } = renderHook(() => useNotificationPreferencesDraft(record));

    expect(result.current.draft).toEqual({
      enabled: true,
      quietHours: { enabled: true, start: "23:00", end: "06:00" },
    });
    expect(result.current.isDirty).toBe(false);
  });

  it("reports the master switch and every silent window field as dirty", () => {
    const record = preferences();
    const { result } = renderHook(() => useNotificationPreferencesDraft(record));

    act(() => result.current.setDraft({ ...result.current.draft, enabled: true }));
    expect(result.current.isDirty).toBe(true);

    act(() =>
      result.current.setDraft({
        ...result.current.draft,
        quietHours: { ...result.current.draft.quietHours, end: "05:00" },
      }),
    );
    expect(result.current.isDirty).toBe(true);
  });

  it("is clean again when the edit restores the persisted values", () => {
    const record = preferences();
    const { result } = renderHook(() => useNotificationPreferencesDraft(record));

    act(() => result.current.setDraft({ ...result.current.draft, enabled: true }));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.setDraft({ ...result.current.draft, enabled: false }));
    expect(result.current.isDirty).toBe(false);
  });

  it("discards the pending edit when a different record arrives", () => {
    const { result, rerender } = renderHook(
      ({ record }: { record: NotificationPreferences }) =>
        useNotificationPreferencesDraft(record),
      { initialProps: { record: preferences() } },
    );

    act(() => result.current.setDraft({ ...result.current.draft, enabled: true }));
    expect(result.current.isDirty).toBe(true);

    // A successful save replaces the record, and the draft follows it instead of
    // keeping the values the user has just persisted.
    rerender({
      record: preferences({
        enabled: true,
        updatedAt: "2026-09-02T08:00:00.000Z",
      }),
    });

    expect(result.current.draft.enabled).toBe(true);
    expect(result.current.isDirty).toBe(false);
  });

  it("never marks a draft dirty while no record is persisted", () => {
    const { result } = renderHook(() => useNotificationPreferencesDraft(null));

    act(() =>
      result.current.setDraft({
        enabled: true,
        quietHours: { enabled: true, start: "21:00", end: "05:00" },
      }),
    );

    expect(result.current.isDirty).toBe(false);
    expect(result.current.draft.enabled).toBe(true);
  });
});
