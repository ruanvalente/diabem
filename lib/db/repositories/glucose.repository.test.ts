import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { glucoseRepository } from "./glucose.repository";

const base = {
  value: 128,
  unit: "mg/dL" as const,
  context: "fasting" as const,
  measuredAt: new Date(2026, 7, 28, 8, 30).toISOString(),
};

beforeEach(async () => {
  const db = getDatabase();
  await db.glucoseReadings.clear();
});

describe("glucoseRepository.create", () => {
  it("creates a reading with generated id, userId and timestamps", async () => {
    const record = await glucoseRepository.create({ ...base, userId: "user-a" });
    expect(record.id).toBeTruthy();
    expect(record.userId).toBe("user-a");
    expect(record.value).toBe(128);
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBeTruthy();
  });
});

describe("glucoseRepository.findByUser", () => {
  it("only returns readings for the requested user (data isolation)", async () => {
    await glucoseRepository.create({ ...base, userId: "user-a", value: 100 });
    await glucoseRepository.create({ ...base, userId: "user-b", value: 200 });

    const userA = await glucoseRepository.findByUser("user-a");
    expect(userA.map((r) => r.value)).toEqual([100]);

    const userB = await glucoseRepository.findByUser("user-b");
    expect(userB.map((r) => r.value)).toEqual([200]);
  });

  it("orders readings newest first", async () => {
    await glucoseRepository.create({
      ...base,
      userId: "user-a",
      measuredAt: new Date(2026, 7, 28, 8, 0).toISOString(),
      value: 80,
    });
    await glucoseRepository.create({
      ...base,
      userId: "user-a",
      measuredAt: new Date(2026, 7, 28, 18, 0).toISOString(),
      value: 120,
    });
    await glucoseRepository.create({
      ...base,
      userId: "user-a",
      measuredAt: new Date(2026, 7, 27, 12, 0).toISOString(),
      value: 90,
    });

    const records = await glucoseRepository.findByUser("user-a");
    expect(records.map((r) => r.value)).toEqual([120, 80, 90]);
  });

  it("filters by context", async () => {
    await glucoseRepository.create({ ...base, userId: "user-a", context: "fasting" });
    await glucoseRepository.create({
      ...base,
      userId: "user-a",
      context: "after_meal",
    });

    const fasting = await glucoseRepository.findByUser("user-a", {
context: "fasting" as const,
    });
    expect(fasting).toHaveLength(1);
    expect(fasting[0].context).toBe("fasting");
  });

  it("filters by inclusive time range", async () => {
    const inRange = new Date(2026, 7, 28, 12, 0).toISOString();
    const before = new Date(2026, 7, 27, 12, 0).toISOString();
    await glucoseRepository.create({ ...base, userId: "user-a", value: 1, measuredAt: before });
    await glucoseRepository.create({ ...base, userId: "user-a", value: 2, measuredAt: inRange });

    const from = new Date(2026, 7, 28, 0, 0).toISOString();
    const to = new Date(2026, 7, 29, 0, 0).toISOString();
    const records = await glucoseRepository.findByUser("user-a", { from, to });
    expect(records.map((r) => r.value)).toEqual([2]);
  });
});

describe("glucoseRepository.findRecentByUser", () => {
  it("returns the newest N readings", async () => {
    for (const [i, dt] of [
      new Date(2026, 7, 28, 8, 0),
      new Date(2026, 7, 28, 10, 0),
      new Date(2026, 7, 28, 12, 0),
    ].entries()) {
      await glucoseRepository.create({
        ...base,
        userId: "user-a",
        value: i + 1,
        measuredAt: dt.toISOString(),
      });
    }
    const recent = await glucoseRepository.findRecentByUser("user-a", 2);
    expect(recent.map((r) => r.value)).toEqual([3, 2]);
  });
});

describe("glucoseRepository.update", () => {
  it("updates editable fields and touches updatedAt", async () => {
    const created = await glucoseRepository.create({ ...base, userId: "user-a" });
    await new Promise((r) => setTimeout(r, 10));

    const updated = await glucoseRepository.update(created.id, { value: 140 });
    expect(updated?.value).toBe(140);
    expect(updated?.context).toBe("fasting");
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });
});

describe("glucoseRepository.deleteById", () => {
  it("deletes an existing reading", async () => {
    const created = await glucoseRepository.create({ ...base, userId: "user-a" });
    expect(await glucoseRepository.deleteById(created.id)).toBe(true);
    expect(await glucoseRepository.findById(created.id)).toBeUndefined();
  });

  it("returns false for a missing reading", async () => {
    expect(await glucoseRepository.deleteById("missing")).toBe(false);
  });
});

describe("glucoseRepository.countByUser", () => {
  it("counts only the user's readings", async () => {
    await glucoseRepository.create({ ...base, userId: "user-a" });
    await glucoseRepository.create({ ...base, userId: "user-a" });
    await glucoseRepository.create({ ...base, userId: "user-b" });
    expect(await glucoseRepository.countByUser("user-a")).toBe(2);
    expect(await glucoseRepository.countByUser("user-b")).toBe(1);
  });
});