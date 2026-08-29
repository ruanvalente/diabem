import { describe, expect, it } from "vitest";
import type { Activity, GlucoseReading, Meal } from "@/lib/db/types";
import {
  getActivityChartData,
  getGlucoseChartData,
  getMealChartData,
  getRecordDistributionData,
} from "./charts";

function glucose(
  id: string,
  value: number,
  local: { y: number; mo: number; d: number; h: number }
): GlucoseReading {
  const measuredAt = new Date(local.y, local.mo, local.d, local.h).toISOString();
  return {
    id,
    userId: "u",
    value,
    unit: "mg/dL",
    context: "fasting",
    measuredAt,
    createdAt: measuredAt,
    updatedAt: measuredAt,
  };
}

function activity(
  id: string,
  startedAt: string,
  durationMinutes: number
): Activity {
  return {
    id,
    userId: "u",
    type: "walking",
    durationMinutes,
    startedAt,
    notes: undefined,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

function meal(id: string, consumedAt: string): Meal {
  return {
    id,
    userId: "u",
    type: "lunch",
    description: "Almoço",
    consumedAt,
    notes: undefined,
    createdAt: consumedAt,
    updatedAt: consumedAt,
  };
}

const NOW = new Date(2026, 7, 28, 12);

describe("getGlucoseChartData", () => {
  it("returns readings chronologically ascending with aggregate stats", () => {
    const data = getGlucoseChartData([
      glucose("b", 140, { y: 2026, mo: 7, d: 28, h: 14 }),
      glucose("a", 120, { y: 2026, mo: 7, d: 28, h: 8 }),
      glucose("c", 180, { y: 2026, mo: 7, d: 27, h: 22 }),
    ]);

    expect(data.points.map((p) => p.value)).toEqual([180, 120, 140]);
    expect(data.points[0].label).toContain("agosto");
    expect(data.count).toBe(3);
    expect(data.average).toBeCloseTo(146.7, 1);
    expect(data.minimum).toBe(120);
    expect(data.maximum).toBe(180);
  });

  it("handles an empty series", () => {
    const data = getGlucoseChartData([]);
    expect(data.points).toEqual([]);
    expect(data.count).toBe(0);
    expect(data.average).toBeNull();
    expect(data.minimum).toBeNull();
    expect(data.maximum).toBeNull();
  });
});

describe("getActivityChartData", () => {
  it("sums minutes per local day inside the range", () => {
    const range = {
      from: new Date(2026, 7, 22, 0).toISOString(),
      to: new Date(2026, 7, 29, 0).toISOString(),
    };
    const data = getActivityChartData(
      [
        activity("a1", new Date(2026, 7, 28, 7).toISOString(), 30),
        activity("a2", new Date(2026, 7, 28, 18).toISOString(), 15),
        activity("a3", new Date(2026, 7, 26, 10).toISOString(), 45),
        activity("a4", new Date(2026, 7, 1, 10).toISOString(), 60),
      ],
      range,
      NOW
    );

    expect(data.days).toHaveLength(7);
    expect(data.days[data.days.length - 1]).toMatchObject({
      label: "Hoje",
      value: 45,
    });
    expect(data.days[4].value).toBe(45);
    expect(data.totalMinutes).toBe(90);
  });

  it("caps buckets to the last 31 days for long ranges", () => {
    const range = {
      from: new Date(2026, 0, 1, 0).toISOString(),
      to: new Date(2026, 7, 29, 0).toISOString(),
    };
    const data = getActivityChartData([], range, NOW);
    expect(data.days.length).toBe(31);
    expect(data.days.at(-1)!.label).toBe("Hoje");
    expect(data.days[0].label).not.toBe("Hoje");
  });

  it("totals the full period even when buckets are capped at 31 days", () => {
    const range = {
      from: new Date(2026, 0, 1, 0).toISOString(),
      to: new Date(2026, 7, 29, 0).toISOString(),
    };
    const data = getActivityChartData(
      [
        activity("jan", new Date(2026, 0, 10, 8).toISOString(), 60),
        activity("aug", new Date(2026, 7, 28, 8).toISOString(), 30),
      ],
      range,
      NOW
    );

    expect(data.days).toHaveLength(31);
    expect(data.totalMinutes).toBe(90);
    expect(data.days.at(-1)!.value).toBe(30);
  });

  it("totals everything for an open range while buckets show the recent 31 days", () => {
    const data = getActivityChartData(
      [
        activity("old", new Date(2026, 0, 2, 8).toISOString(), 45),
        activity("today", new Date(2026, 7, 28, 9).toISOString(), 20),
      ],
      {},
      NOW
    );

    expect(data.days).toHaveLength(31);
    expect(data.totalMinutes).toBe(65);
  });

  it("spans months for a cross-month custom range", () => {
    const range = {
      from: new Date(2026, 6, 20, 0).toISOString(),
      to: new Date(2026, 7, 6, 0).toISOString(),
    };
    const data = getActivityChartData(
      [
        activity("jul", new Date(2026, 6, 21, 8).toISOString(), 30),
        activity("aug", new Date(2026, 7, 5, 8).toISOString(), 45),
      ],
      range,
      NOW
    );

    expect(data.days).toHaveLength(17);
    expect(data.totalMinutes).toBe(75);
  });

  it("produces a single bucket for a today range", () => {
    const range = {
      from: new Date(2026, 7, 28, 0).toISOString(),
      to: new Date(2026, 7, 29, 0).toISOString(),
    };
    const data = getActivityChartData([], range, NOW);
    expect(data.days).toHaveLength(1);
  });
});

describe("getMealChartData", () => {
  it("counts meals per local day inside the range", () => {
    const range = {
      from: new Date(2026, 7, 22, 0).toISOString(),
      to: new Date(2026, 7, 29, 0).toISOString(),
    };
    const data = getMealChartData(
      [
        meal("m1", new Date(2026, 7, 28, 8).toISOString()),
        meal("m2", new Date(2026, 7, 28, 12).toISOString()),
        meal("m3", new Date(2026, 7, 27, 20).toISOString()),
      ],
      range,
      NOW
    );

    expect(data.days).toHaveLength(7);
    expect(data.days.at(-1)!.value).toBe(2);
    expect(data.days[5].value).toBe(1);
    expect(data.totalCount).toBe(3);
  });
});

describe("getRecordDistributionData", () => {
  it("distributes timestamps into morning, afternoon and evening", () => {
    const data = getRecordDistributionData([
      new Date(2026, 7, 28, 8).toISOString(),
      new Date(2026, 7, 28, 12).toISOString(),
      new Date(2026, 7, 28, 21).toISOString(),
      new Date(2026, 7, 28, 23).toISOString(),
    ]);

    expect(data.total).toBe(4);
    expect(data.items.find((i) => i.period === "morning")!.count).toBe(1);
    expect(data.items.find((i) => i.period === "afternoon")!.count).toBe(1);
    expect(data.items.find((i) => i.period === "evening")!.count).toBe(2);
  });

  it("treats late-night hours as evening", () => {
    const data = getRecordDistributionData([
      new Date(2026, 7, 28, 3).toISOString(),
    ]);
    const evening = data.items.find((i) => i.period === "evening")!;
    expect(evening.count).toBe(1);
  });

  it("returns zeroed buckets for no records", () => {
    const data = getRecordDistributionData([]);
    expect(data.total).toBe(0);
    expect(data.items.every((item) => item.count === 0)).toBe(true);
  });
});