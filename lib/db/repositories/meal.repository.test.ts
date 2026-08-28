import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { mealRepository } from "./meal.repository";

const base = {
  type: "lunch" as const,
  description: "Arroz, feijão e frango",
  consumedAt: new Date(2026, 7, 28, 12, 30).toISOString(),
};

beforeEach(async () => {
  const db = getDatabase();
  await db.meals.clear();
});

describe("mealRepository", () => {
  it("creates a meal with generated id, userId and timestamps", async () => {
    const meal = await mealRepository.create({ ...base, userId: "user-a" });
    expect(meal.id).toBeTruthy();
    expect(meal.userId).toBe("user-a");
    expect(meal.type).toBe("lunch");
    expect(meal.createdAt).toBeTruthy();
  });

  it("isolates data per user and orders newest first", async () => {
    await mealRepository.create({
      ...base,
      userId: "user-a",
      consumedAt: new Date(2026, 7, 28, 8, 0).toISOString(),
    });
    await mealRepository.create({
      ...base,
      userId: "user-a",
      description: "Jantar leve",
      consumedAt: new Date(2026, 7, 28, 19, 0).toISOString(),
    });
    await mealRepository.create({ ...base, userId: "user-b" });

    const userA = await mealRepository.findByUser("user-a");
    expect(userA.map((m) => m.description)).toEqual(["Jantar leve", "Arroz, feijão e frango"]);
    expect(await mealRepository.findByUser("user-b")).toHaveLength(1);
  });

  it("filters by type and time range", async () => {
    await mealRepository.create({ ...base, userId: "user-a", type: "breakfast" });
    await mealRepository.create({ ...base, userId: "user-a", type: "lunch" });

    const lunches = await mealRepository.findByUser("user-a", { type: "lunch" });
    expect(lunches.map((m) => m.type)).toEqual(["lunch"]);

    const from = new Date(2026, 7, 29, 0, 0).toISOString();
    const to = new Date(2026, 7, 30, 0, 0).toISOString();
    expect(await mealRepository.findByUser("user-a", { from, to })).toHaveLength(0);
  });

  it("updates and deletes meals", async () => {
    const created = await mealRepository.create({ ...base, userId: "user-a" });
    const updated = await mealRepository.update(created.id, { description: "Mudou" });
    expect(updated?.description).toBe("Mudou");
    expect(await mealRepository.deleteById(created.id)).toBe(true);
    expect(await mealRepository.findById(created.id)).toBeUndefined();
  });

  it("counts only the user's meals", async () => {
    await mealRepository.create({ ...base, userId: "user-a" });
    await mealRepository.create({ ...base, userId: "user-a" });
    await mealRepository.create({ ...base, userId: "user-b" });
    expect(await mealRepository.countByUser("user-a")).toBe(2);
  });
});