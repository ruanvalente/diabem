import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { activityRepository } from "./activity.repository";

const base = {
  type: "walking" as const,
  durationMinutes: 30,
  startedAt: new Date(2026, 7, 28, 7, 0).toISOString(),
};

beforeEach(async () => {
  const db = getDatabase();
  await db.activities.clear();
});

describe("activityRepository", () => {
  it("creates an activity with generated id, userId and timestamps", async () => {
    const activity = await activityRepository.create({ ...base, userId: "user-a" });
    expect(activity.id).toBeTruthy();
    expect(activity.userId).toBe("user-a");
    expect(activity.durationMinutes).toBe(30);
    expect(activity.createdAt).toBeTruthy();
  });

  it("isolates data per user and orders newest first", async () => {
    await activityRepository.create({
      ...base,
      userId: "user-a",
      type: "running",
      startedAt: new Date(2026, 7, 28, 7, 0).toISOString(),
      durationMinutes: 25,
    });
    await activityRepository.create({
      ...base,
      userId: "user-a",
      type: "gym",
      startedAt: new Date(2026, 7, 28, 9, 0).toISOString(),
      durationMinutes: 60,
    });
    await activityRepository.create({ ...base, userId: "user-b", type: "cycling" });

    const userA = await activityRepository.findByUser("user-a");
    expect(userA.map((a) => a.type)).toEqual(["gym", "running"]);
    expect(await activityRepository.findByUser("user-b")).toHaveLength(1);
  });

  it("filters by type", async () => {
    await activityRepository.create({ ...base, userId: "user-a", type: "walking" });
    await activityRepository.create({ ...base, userId: "user-a", type: "gym" });

    const gym = await activityRepository.findByUser("user-a", { type: "gym" });
    expect(gym.map((a) => a.type)).toEqual(["gym"]);
  });

  it("updates and deletes activities", async () => {
    const created = await activityRepository.create({ ...base, userId: "user-a" });
    const updated = await activityRepository.update(created.id, { durationMinutes: 45 });
    expect(updated?.durationMinutes).toBe(45);
    expect(await activityRepository.deleteById(created.id)).toBe(true);
    expect(await activityRepository.findById(created.id)).toBeUndefined();
  });

  it("counts only the user's activities", async () => {
    await activityRepository.create({ ...base, userId: "user-a" });
    await activityRepository.create({ ...base, userId: "user-b" });
    expect(await activityRepository.countByUser("user-a")).toBe(1);
    expect(await activityRepository.countByUser("user-b")).toBe(1);
  });
});