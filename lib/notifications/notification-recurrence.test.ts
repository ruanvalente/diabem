import { describe, expect, it } from "vitest";
import {
  clampTimerDelay,
  getNextOccurrence,
  getOccurrenceKey,
  isWithinQuietHours,
  resolveTimeZone,
} from "./notification-recurrence";
import {
  NOTIFICATION_WEEKDAY_KEYS,
  type NotificationQuietHours,
  type NotificationWeekdayKey,
} from "./types";

const allDays: NotificationWeekdayKey[] = [...NOTIFICATION_WEEKDAY_KEYS];

describe("resolveTimeZone", () => {
  it("returns the provided valid time zone", () => {
    expect(resolveTimeZone("America/Belem", "UTC")).toBe("America/Belem");
  });

  it("falls back when the time zone is invalid", () => {
    expect(resolveTimeZone("Mars/Olympus_Mons", "UTC")).toBe("UTC");
  });

  it("falls back when no time zone was provided", () => {
    expect(resolveTimeZone(undefined, "UTC")).toBe("UTC");
  });
});

describe("getNextOccurrence", () => {
  it("picks the later time today", () => {
    const occurrence = getNextOccurrence(
      { time: "08:00", daysOfWeek: allDays, timeZone: "UTC" },
      new Date("2026-01-05T07:00:00.000Z"),
    );

    expect(occurrence?.toISOString()).toBe("2026-01-05T08:00:00.000Z");
  });

  it("rolls over to the next allowed day", () => {
    const occurrence = getNextOccurrence(
      { time: "08:00", daysOfWeek: ["wednesday"], timeZone: "UTC" },
      new Date("2026-01-05T09:00:00.000Z"),
    );

    expect(occurrence?.toISOString()).toBe("2026-01-07T08:00:00.000Z");
  });

  const nonLocalCases: {
    timeZone: string;
    time: string;
    expected: string;
  }[] = [
    {
      timeZone: "America/Belem",
      time: "08:00",
      expected: "2026-01-05T11:00:00.000Z",
    },
    {
      timeZone: "Asia/Tokyo",
      time: "10:00",
      expected: "2026-01-05T01:00:00.000Z",
    },
  ];

  it.each(nonLocalCases)(
    "converts the local time of $timeZone to the expected UTC instant",
    ({ timeZone, time, expected }) => {
      const occurrence = getNextOccurrence(
        { time, daysOfWeek: ["monday"], timeZone },
        new Date("2026-01-05T00:00:00.000Z"),
      );

      expect(occurrence?.toISOString()).toBe(expected);
    },
  );

  it("returns null when no weekday is allowed", () => {
    expect(
      getNextOccurrence(
        { time: "08:00", daysOfWeek: [], timeZone: "UTC" },
        new Date("2026-01-05T07:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it("returns null for an invalid time", () => {
    expect(
      getNextOccurrence(
        { time: "invalid", daysOfWeek: allDays, timeZone: "UTC" },
        new Date("2026-01-05T07:00:00.000Z"),
      ),
    ).toBeNull();
  });
});

describe("getOccurrenceKey", () => {
  it("builds a stable key from id and epoch milliseconds", () => {
    const occurrence = new Date("2026-01-05T08:00:00.000Z");

    expect(getOccurrenceKey("schedule-1", occurrence)).toBe(
      "schedule-1@1767600000000",
    );
  });
});

describe("isWithinQuietHours", () => {
  const daytimeQuietHours: NotificationQuietHours = {
    enabled: true,
    start: "08:00",
    end: "17:00",
  };

  it("returns true inside the window", () => {
    expect(
      isWithinQuietHours(
        new Date("2026-01-05T09:00:00.000Z"),
        daytimeQuietHours,
        "UTC",
      ),
    ).toBe(true);
  });

  it("returns false outside the window", () => {
    expect(
      isWithinQuietHours(
        new Date("2026-01-05T18:00:00.000Z"),
        daytimeQuietHours,
        "UTC",
      ),
    ).toBe(false);
  });

  const midnightQuietHours: NotificationQuietHours = {
    enabled: true,
    start: "22:00",
    end: "07:00",
  };

  it.each([
    "2026-01-05T23:30:00.000Z",
    "2026-01-06T06:30:00.000Z",
  ])("detects the quiet-hours window that crosses midnight in %s", (isoDate) => {
    expect(isWithinQuietHours(new Date(isoDate), midnightQuietHours, "UTC")).toBe(
      true,
    );
  });

  it("returns false when quiet hours are disabled", () => {
    expect(
      isWithinQuietHours(
        new Date("2026-01-05T23:00:00.000Z"),
        { ...midnightQuietHours, enabled: false },
        "UTC",
      ),
    ).toBe(false);
  });

  it("treats start equal to end as quiet hours disabled", () => {
    expect(
      isWithinQuietHours(
        new Date("2026-01-05T08:00:00.000Z"),
        { enabled: true, start: "08:00", end: "08:00" },
        "UTC",
      ),
    ).toBe(false);
  });
});

describe("clampTimerDelay", () => {
  it("converts negative delays to zero", () => {
    expect(clampTimerDelay(-1)).toBe(0);
  });

  it("clamps delays above the maximum supported by a timer", () => {
    expect(clampTimerDelay(2 ** 31)).toBe(2 ** 31 - 1);
  });
});
