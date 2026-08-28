import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import { createGlucoseReading } from "./glucose.service";
import { createMeal } from "./meal.service";
import { createActivity } from "./activity.service";
import { createNote } from "./note.service";
import { listTimeline } from "./timeline.service";

beforeEach(async () => {
  const db = getDatabase();
  await db.glucoseReadings.clear();
  await db.meals.clear();
  await db.activities.clear();
  await db.notes.clear();
});

describe("listTimeline", () => {
  it("consolidates all record types into a single series, newest first", async () => {
    await createGlucoseReading("user-a", {
      value: 128,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    await createMeal("user-a", {
      type: "lunch",
      description: "Arroz, feijão e frango",
      consumedAtLocal: "2026-08-28T12:30",
    });
    await createActivity("user-a", {
      type: "walking",
      durationMinutes: 30,
      startedAtLocal: "2026-08-28T07:00",
    });
    await createNote("user-a", { content: "Hoje acordei bem." });

    const result = await listTimeline("user-a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.map((e) => e.type)).toEqual([
      "meal",
      "note",
      "glucose",
      "activity",
    ]);
  });

  it("filters by event type", async () => {
    await createGlucoseReading("user-a", {
      value: 100,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    await createNote("user-a", { content: "uma nota" });

    const result = await listTimeline("user-a", { type: "note" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe("note");
    }
  });

  it("only considers records inside the requested period", async () => {
    await createGlucoseReading("user-a", {
      value: 128,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    await createGlucoseReading("user-a", {
      value: 90,
      context: "bedtime",
      measuredAtLocal: "2026-08-25T22:00",
    });

    const result = await listTimeline("user-a", {
      from: new Date(2026, 7, 28, 0, 0).toISOString(),
      to: new Date(2026, 7, 29, 0, 0).toISOString(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      if (result.data[0].type === "glucose") {
        expect(result.data[0].data.value).toBe(128);
      }
    }
  });

  it("never mixes records from another user", async () => {
    await createGlucoseReading("user-a", {
      value: 100,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    await createGlucoseReading("user-b", {
      value: 300,
      context: "fasting",
      measuredAtLocal: "2026-08-28T09:00",
    });

    const result = await listTimeline("user-a");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      if (result.data[0].type === "glucose") {
        expect(result.data[0].data.value).toBe(100);
      }
    }
  });
});