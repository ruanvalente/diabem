import { describe, expect, it } from "vitest";
import { getTimeOfDay, groupByTimeOfDay } from "./time-slots";

function timestamp(h: number): string {
  return new Date(2026, 7, 28, h).toISOString();
}

describe("getTimeOfDay", () => {
  it("classifies morning hours", () => {
    expect(getTimeOfDay(timestamp(6))).toBe("morning");
    expect(getTimeOfDay(timestamp(11))).toBe("morning");
  });

  it("classifies afternoon hours", () => {
    expect(getTimeOfDay(timestamp(12))).toBe("afternoon");
    expect(getTimeOfDay(timestamp(17))).toBe("afternoon");
  });

  it("classifies evening hours", () => {
    expect(getTimeOfDay(timestamp(18))).toBe("evening");
    expect(getTimeOfDay(timestamp(23))).toBe("evening");
  });

  it("classifies night hours", () => {
    expect(getTimeOfDay(timestamp(0))).toBe("night");
    expect(getTimeOfDay(timestamp(5))).toBe("night");
  });
});

describe("groupByTimeOfDay", () => {
  it("groups values by time slot with aggregate stats", () => {
    const result = groupByTimeOfDay([
      { timestamp: timestamp(8), value: 100 },
      { timestamp: timestamp(9), value: 120 },
      { timestamp: timestamp(13), value: 140 },
      { timestamp: timestamp(20), value: 160 },
    ]);

    expect(result).toHaveLength(4);
    const morning = result.find((r) => r.period === "morning")!;
    expect(morning.count).toBe(2);
    expect(morning.average).toBe(110);
    expect(morning.minimum).toBe(100);
    expect(morning.maximum).toBe(120);

    expect(result.find((r) => r.period === "afternoon")!.count).toBe(1);
    expect(result.find((r) => r.period === "evening")!.count).toBe(1);
    expect(result.find((r) => r.period === "night")!.count).toBe(0);
  });

  it("returns empty slots without averages for no data", () => {
    const result = groupByTimeOfDay([]);
    expect(result.every((r) => r.count === 0 && r.average === undefined)).toBe(
      true
    );
  });
});
