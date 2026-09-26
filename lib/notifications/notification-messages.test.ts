import { describe, expect, it } from "vitest";
import {
  buildNotificationBody,
  buildNotificationTag,
  buildNotificationTitle,
  resolveNotificationRoute,
} from "./notification-messages";
import type { NotificationReminderType } from "./types";

describe("buildNotificationTitle", () => {
  it("uses the period label when the label is empty", () => {
    expect(buildNotificationTitle({ label: "  ", period: "morning" })).toBe(
      "Manhã",
    );
  });

  it("uses the provided label when present", () => {
    expect(
      buildNotificationTitle({ label: "Antes das refeições", period: "morning" }),
    ).toBe("Antes das refeições");
  });
});

describe("buildNotificationBody", () => {
  it("includes the period phrase and every reminder phrase without user data", () => {
    const schedule = {
      period: "morning" as const,
      reminderTypes: [
        "glucose",
        "meal",
        "activity",
        "medication",
        "note",
      ] as NotificationReminderType[],
      userId: "user-maria",
      glucoseValue: 180,
    };
    const body = buildNotificationBody(schedule);

    expect(body).toContain(
      "Bom dia! Reserve um momento para registrar seus dados de hoje.",
    );
    expect(body).toContain("Lembre-se de registrar sua medição.");
    expect(body).toContain("Lembre-se de registrar sua alimentação.");
    expect(body).toContain("Reserve um momento para registrar sua atividade.");
    expect(body).toContain("Lembre-se de registrar sua medicação.");
    expect(body).toContain("Reserve um momento para registrar uma observação.");
    expect(body).not.toContain("user-maria");
    expect(body).not.toContain("180");
  });
});

describe("resolveNotificationRoute", () => {
  const routes: { reminderType: NotificationReminderType; expected: string }[] = [
    { reminderType: "glucose", expected: "/glucose" },
    { reminderType: "meal", expected: "/meals" },
    { reminderType: "activity", expected: "/activity" },
    { reminderType: "medication", expected: "/medications" },
    { reminderType: "note", expected: "/notes" },
  ];

  it.each(routes)(
    "mapeia $reminderType para $expected",
    ({ reminderType, expected }) => {
      expect(resolveNotificationRoute({ reminderTypes: [reminderType] })).toBe(
        expected,
      );
    },
  );

  it("uses the dashboard when no type was selected", () => {
    expect(resolveNotificationRoute({ reminderTypes: [] })).toBe("/dashboard");
  });
});

describe("buildNotificationTag", () => {
  it("prefixes the tag with the DiaBem identifier", () => {
    const tag: string = buildNotificationTag("schedule-1");

    expect(tag.startsWith("diabem-reminder-")).toBe(true);
    expect(tag).toBe("diabem-reminder-schedule-1");
  });
});
