import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import {
  createGlucoseReading,
  deleteGlucoseReading,
  listGlucoseReadings,
  updateGlucoseReading,
} from "./glucose.service";
import { glucoseRepository } from "../db/repositories/glucose.repository";

beforeEach(async () => {
  const db = getDatabase();
  await db.glucoseReadings.clear();
});

const validInput = {
  value: 128,
  context: "fasting" as const,
  measuredAtLocal: "2026-08-28T08:30",
};

describe("createGlucoseReading", () => {
  it("stores the local datetime as a UTC instant", async () => {
    const result = await createGlucoseReading("user-a", validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.userId).toBe("user-a");
    expect(result.data.measuredAt).toBe(
      new Date(2026, 7, 28, 8, 30).toISOString()
    );
    expect(result.data.unit).toBe("mg/dL");
  });

  it("normalizes an empty note to an empty string", async () => {
    const result = await createGlucoseReading("user-a", {
      ...validInput,
      notes: "   ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.notes).toBe("");
  });

  it("rejects invalid dates, values and contexts", async () => {
    expect(
      (await createGlucoseReading("user-a", { ...validInput, measuredAtLocal: "" })).ok
    ).toBe(false);
    expect(
      (await createGlucoseReading("user-a", { ...validInput, measuredAtLocal: "ontem" })).ok
    ).toBe(false);
    expect(
      (await createGlucoseReading("user-a", { ...validInput, value: 0 })).ok
    ).toBe(false);
    expect(
      (await createGlucoseReading("user-a", { ...validInput, value: -5 })).ok
    ).toBe(false);
    // @ts-expect-error intentionally invalid context
    expect((await createGlucoseReading("user-a", { ...validInput, context: "random" })).ok).toBe(false);
  });
});

describe("updateGlucoseReading", () => {
  it("only edits records owned by the user", async () => {
    const mine = await createGlucoseReading("user-a", validInput);
    const theirs = await createGlucoseReading("user-b", validInput);
    if (!mine.ok || !theirs.ok) throw new Error("setup failed");

    expect((await updateGlucoseReading("user-a", theirs.data.id, { value: 10 })).ok).toBe(false);
    const result = await updateGlucoseReading("user-a", mine.data.id, { value: 250 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.value).toBe(250);
      expect(result.data.measuredAt).toBe(mine.data.measuredAt);
    }
  });

  it("clears a previously saved note when the note is blanked", async () => {
    const created = await createGlucoseReading("user-a", {
      ...validInput,
      notes: "Antes do café",
    });
    if (!created.ok) throw new Error("setup failed");
    expect(created.data.notes).toBe("Antes do café");

    const result = await updateGlucoseReading("user-a", created.data.id, {
      notes: "   ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.notes).toBe("");
  });
});

describe("deleteGlucoseReading", () => {
  it("only deletes records owned by the user", async () => {
    const theirs = await createGlucoseReading("user-b", validInput);
    if (!theirs.ok) throw new Error("setup failed");

    expect((await deleteGlucoseReading("user-a", theirs.data.id)).ok).toBe(false);
    expect(await glucoseRepository.findById(theirs.data.id)).toBeDefined();

    const mine = await createGlucoseReading("user-a", validInput);
    if (!mine.ok) throw new Error("setup failed");
    expect((await deleteGlucoseReading("user-a", mine.data.id)).ok).toBe(true);
    expect(await glucoseRepository.findById(mine.data.id)).toBeUndefined();
  });
});

describe("listGlucoseReadings", () => {
  it("returns readings sorted newest first", async () => {
    await createGlucoseReading("user-a", {
      ...validInput,
      measuredAtLocal: "2026-08-28T08:00",
      value: 80,
    });
    await createGlucoseReading("user-a", {
      ...validInput,
      measuredAtLocal: "2026-08-28T18:00",
      value: 120,
    });

    const result = await listGlucoseReadings("user-a");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((r) => r.value)).toEqual([120, 80]);
    }
  });
});