import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import { createGlucoseReading } from "./glucose.service";
import { createMeal } from "./meal.service";
import { createActivity } from "./activity.service";
import { createNote } from "./note.service";
import { createMedication } from "./medication.service";
import { listTimeline } from "./timeline.service";

beforeEach(async () => {
  const db = getDatabase();
  await db.glucoseReadings.clear();
  await db.meals.clear();
  await db.activities.clear();
  await db.notes.clear();
  await db.medications.clear();
});

describe("listTimeline", () => {
  it("consolidates all record types into a single series, newest first", async () => {
    const glucose = await createGlucoseReading("user-a", {
      value: 128,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    const meal = await createMeal("user-a", {
      type: "lunch",
      description: "Arroz, feijão e frango",
      consumedAtLocal: "2026-08-28T12:30",
    });
    const activity = await createActivity("user-a", {
      type: "walking",
      durationMinutes: 30,
      startedAtLocal: "2026-08-28T07:00",
    });
    const note = await createNote("user-a", { content: "Hoje acordei bem." });
    const medication = await createMedication("user-a", {
      name: "Metformina",
      medicatedAtLocal: "2026-08-28T09:00",
    });
    if (!glucose.ok || !meal.ok || !activity.ok || !note.ok || !medication.ok) {
      throw new Error("setup failed");
    }

    const result = await listTimeline("user-a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expectedOrder = [
      meal.data.consumedAt,
      note.data.createdAt,
      medication.data.medicatedAt,
      glucose.data.measuredAt,
      activity.data.startedAt,
    ].sort((a, b) => b.localeCompare(a));

    expect(result.data.map((e) => e.at)).toEqual(expectedOrder);
    expect(result.data).toHaveLength(5);
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

  it("keeps only the record types listed in the multi-type filter", async () => {
    await createGlucoseReading("user-a", {
      value: 100,
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
    await createNote("user-a", { content: "uma nota" });

    const result = await listTimeline("user-a", {
      types: ["glucose", "activity"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      const kinds = result.data.map((event) => event.type).sort();
      expect(kinds).toEqual(["activity", "glucose"]);
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

  it("filters by medication type", async () => {
    await createGlucoseReading("user-a", {
      value: 100,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    await createMedication("user-a", {
      name: "Metformina",
      medicatedAtLocal: "2026-08-28T09:00",
    });
    await createNote("user-a", { content: "uma nota" });

    const result = await listTimeline("user-a", { type: "medication" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe("medication");
    }
  });

  it("keeps only medication in multi-type filter", async () => {
    await createGlucoseReading("user-a", {
      value: 100,
      context: "fasting",
      measuredAtLocal: "2026-08-28T08:30",
    });
    await createMedication("user-a", {
      name: "Metformina",
      medicatedAtLocal: "2026-08-28T09:00",
    });
    await createNote("user-a", { content: "uma nota" });

    const result = await listTimeline("user-a", {
      types: ["medication", "note"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      const kinds = result.data.map((e) => e.type).sort();
      expect(kinds).toEqual(["medication", "note"]);
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