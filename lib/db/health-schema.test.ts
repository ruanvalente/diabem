import { describe, expect, it } from "vitest";
import {
  activitySchema,
  glucoseReadingSchema,
  mealSchema,
  noteSchema,
} from "./schema";

const validDate = new Date(2026, 7, 28, 8, 30).toISOString();

describe("glucoseReadingSchema", () => {
  const base = {
    value: 128,
    context: "fasting",
    measuredAt: validDate,
  };

  it("accepts a valid reading", () => {
    const result = glucoseReadingSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts values outside the expected range without judging them", () => {
    for (const value of [55, 200, 320, 500]) {
      expect(glucoseReadingSchema.safeParse({ ...base, value }).success).toBe(true);
    }
  });

  it("rejects missing, non-numeric, zero and negative values", () => {
    expect(glucoseReadingSchema.safeParse({ ...base, value: undefined }).success).toBe(false);
    expect(glucoseReadingSchema.safeParse({ ...base, value: "128" }).success).toBe(false);
    expect(glucoseReadingSchema.safeParse({ ...base, value: 0 }).success).toBe(false);
    expect(glucoseReadingSchema.safeParse({ ...base, value: -5 }).success).toBe(false);
    expect(glucoseReadingSchema.safeParse({ ...base, value: 9999 }).success).toBe(false);
  });

  it("rejects an invalid context and an invalid date", () => {
    expect(
      glucoseReadingSchema.safeParse({ ...base, context: "random" }).success
    ).toBe(false);
    expect(
      glucoseReadingSchema.safeParse({ ...base, measuredAt: "not-a-date" }).success
    ).toBe(false);
  });

  it("normalizes empty notes to an empty string", () => {
    const result = glucoseReadingSchema.safeParse({ ...base, notes: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("");
    }
  });
});

describe("mealSchema", () => {
  const base = {
    type: "lunch",
    description: "Arroz, feijão e frango",
    consumedAt: validDate,
  };

  it("accepts a valid meal", () => {
    expect(mealSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid type and empty description", () => {
    expect(mealSchema.safeParse({ ...base, type: "brunch" }).success).toBe(false);
    expect(mealSchema.safeParse({ ...base, description: "x" }).success).toBe(false);
    expect(mealSchema.safeParse({ ...base, description: undefined }).success).toBe(false);
  });
});

describe("activitySchema", () => {
  const base = {
    type: "walking",
    durationMinutes: 30,
    startedAt: validDate,
  };

  it("accepts a valid activity", () => {
    expect(activitySchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid type and out-of-range durations", () => {
    expect(activitySchema.safeParse({ ...base, type: "marathon" }).success).toBe(false);
    expect(activitySchema.safeParse({ ...base, durationMinutes: 0 }).success).toBe(false);
    expect(activitySchema.safeParse({ ...base, durationMinutes: 1441 }).success).toBe(false);
    expect(activitySchema.safeParse({ ...base, durationMinutes: 30.5 }).success).toBe(false);
    expect(activitySchema.safeParse({ ...base, durationMinutes: undefined }).success).toBe(false);
  });
});

describe("noteSchema", () => {
  it("accepts a valid note", () => {
    expect(noteSchema.safeParse({ content: "Hoje acordei cansado." }).success).toBe(true);
  });

  it("rejects empty and oversized notes", () => {
    expect(noteSchema.safeParse({ content: "   " }).success).toBe(false);
    expect(noteSchema.safeParse({ content: "" }).success).toBe(false);
    expect(noteSchema.safeParse({ content: "a".repeat(2001) }).success).toBe(false);
  });
});