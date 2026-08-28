import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import { createMeal } from "./meal.service";
import { createActivity } from "./activity.service";
import { createNote } from "./note.service";
import { deleteMeal } from "./meal.service";
import { deleteActivity } from "./activity.service";
import { deleteNote } from "./note.service";

beforeEach(async () => {
  const db = getDatabase();
  await db.meals.clear();
  await db.activities.clear();
  await db.notes.clear();
});

describe("createMeal", () => {
  it("creates a meal with a UTC instant", async () => {
    const result = await createMeal("user-a", {
      type: "lunch",
      description: "Arroz, feijão e frango",
      consumedAtLocal: "2026-08-28T12:30",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.consumedAt).toBe(new Date(2026, 7, 28, 12, 30).toISOString());
    }
  });

  it("rejects an empty description and invalid datetime", async () => {
    expect(
      (await createMeal("user-a", { ...validMeal, description: "x" })).ok
    ).toBe(false);
    expect(
      (await createMeal("user-a", { ...validMeal, consumedAtLocal: "" })).ok
    ).toBe(false);
  });
});

describe("createActivity", () => {
  it("creates an activity", async () => {
    const result = await createActivity("user-a", {
      type: "walking",
      durationMinutes: 35,
      startedAtLocal: "2026-08-28T07:00",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.durationMinutes).toBe(35);
  });

  it("rejects an out-of-range duration", async () => {
    expect(
      (await createActivity("user-a", { ...validActivity, durationMinutes: 0 })).ok
    ).toBe(false);
  });
});

describe("createNote", () => {
  it("creates a note", async () => {
    const result = await createNote("user-a", { content: "Hoje acordei bem." });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.content).toBe("Hoje acordei bem.");
  });

  it("rejects an empty note", async () => {
    expect((await createNote("user-a", { content: "   " })).ok).toBe(false);
  });
});

describe("ownership is enforced for meals, activities and notes", () => {
  it("refuses to delete records belonging to another user", async () => {
    const meal = await createMeal("user-b", validMeal);
    const activity = await createActivity("user-b", validActivity);
    const note = await createNote("user-b", { content: "privada" });
    if (!meal.ok || !activity.ok || !note.ok) throw new Error("setup failed");

    expect((await deleteMeal("user-a", meal.data.id)).ok).toBe(false);
    expect((await deleteActivity("user-a", activity.data.id)).ok).toBe(false);
    expect((await deleteNote("user-a", note.data.id)).ok).toBe(false);

    expect((await deleteMeal("user-b", meal.data.id)).ok).toBe(true);
    expect((await deleteActivity("user-b", activity.data.id)).ok).toBe(true);
    expect((await deleteNote("user-b", note.data.id)).ok).toBe(true);
  });
});

const validMeal = {
  type: "lunch" as const,
  description: "Arroz, feijão e frango",
  consumedAtLocal: "2026-08-28T12:30",
};

const validActivity = {
  type: "walking" as const,
  durationMinutes: 30,
  startedAtLocal: "2026-08-28T07:00",
};