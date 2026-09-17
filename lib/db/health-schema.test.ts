import { describe, expect, it } from "vitest";
import {
  activitySchema,
  glucoseReadingSchema,
  mealSchema,
  medicationSchema,
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

describe("medicationSchema", () => {
  const base = {
    name: "Metformina",
    medicatedAt: validDate,
  };

  it("accepts a valid medication with only required fields", () => {
    expect(medicationSchema.safeParse(base).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = medicationSchema.safeParse({
      ...base,
      dosage: "500",
      unit: "mg",
      frequency: "2x ao dia",
      route: "oral",
      notes: "Tomar com café",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dosage).toBe("500");
      expect(result.data.unit).toBe("mg");
    }
  });

  it("rejects missing and empty name", () => {
    expect(medicationSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, name: undefined }).success).toBe(false);
  });

  it("rejects missing and invalid medicatedAt", () => {
    expect(
      medicationSchema.safeParse({ ...base, medicatedAt: "" }).success
    ).toBe(false);
    expect(
      medicationSchema.safeParse({ ...base, medicatedAt: "not-a-date" }).success
    ).toBe(false);
    expect(
      medicationSchema.safeParse({ ...base, medicatedAt: undefined }).success
    ).toBe(false);
  });

  it("accepts valid decimal dosage formats", () => {
    for (const dosage of ["500", "10", "1,5", "0.5", "12.5"]) {
      expect(medicationSchema.safeParse({ ...base, dosage }).success).toBe(true);
    }
  });

  it("rejects invalid dosage format", () => {
    expect(medicationSchema.safeParse({ ...base, dosage: "abc" }).success).toBe(
      false,
    );
    expect(medicationSchema.safeParse({ ...base, dosage: "-5" }).success).toBe(
      false,
    );
    expect(
      medicationSchema.safeParse({ ...base, dosage: "500mg" }).success,
    ).toBe(false);
  });

  it("transforms empty optional fields to undefined", () => {
    const result = medicationSchema.safeParse({
      ...base,
      dosage: "  ",
      unit: "  ",
      frequency: "",
      route: "",
      notes: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dosage).toBeUndefined();
      expect(result.data.unit).toBeUndefined();
      expect(result.data.frequency).toBeUndefined();
      expect(result.data.route).toBeUndefined();
      expect(result.data.notes).toBe("");
    }
  });

  it("rejects oversized name", () => {
    expect(
      medicationSchema.safeParse({ ...base, name: "a".repeat(101) }).success,
    ).toBe(false);
  });

  it("rejects oversized dosage", () => {
    expect(
      medicationSchema.safeParse({ ...base, dosage: "1".repeat(31) }).success,
    ).toBe(false);
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