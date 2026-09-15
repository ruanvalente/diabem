import { describe, expect, it, vi, beforeEach } from "vitest";
import { getDataContext } from "./data-context.service";
import type { GlucoseReading, Meal, Note } from "@/lib/db/types";

vi.mock("@/lib/db/repositories/glucose.repository", () => ({
  glucoseRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/meal.repository", () => ({
  mealRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/activity.repository", () => ({
  activityRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/note.repository", () => ({
  noteRepository: { findByUser: vi.fn() },
}));

import { glucoseRepository } from "@/lib/db/repositories/glucose.repository";
import { mealRepository } from "@/lib/db/repositories/meal.repository";
import { activityRepository } from "@/lib/db/repositories/activity.repository";
import { noteRepository } from "@/lib/db/repositories/note.repository";

function glucose(id: string, value: number, at: string): GlucoseReading {
  return {
    id,
    userId: "u",
    value,
    unit: "mg/dL",
    context: "fasting",
    measuredAt: at,
    provenance: { source: "manual", recordedAt: at },
    createdAt: at,
    updatedAt: at,
  };
}

function meal(id: string, at: string): Meal {
  return {
    id,
    userId: "u",
    type: "lunch",
    description: "Almoço",
    consumedAt: at,
    provenance: { source: "device", sourceId: "dev-1", recordedAt: at },
    createdAt: at,
    updatedAt: at,
  };
}

function note(id: string, at: string): Note {
  return {
    id,
    userId: "u",
    content: "Observação sensível",
    provenance: { source: "speech", recordedAt: at },
    createdAt: at,
    updatedAt: at,
  };
}

const PERIOD = { from: "2026-09-01T00:00:00.000Z", to: "2026-09-07T00:00:00.000Z" };

describe("getDataContext", () => {
  beforeEach(() => {
    vi.mocked(glucoseRepository.findByUser).mockResolvedValue([
      glucose("g1", 100, "2026-09-02T08:00:00.000Z"),
      glucose("g2", 120, "2026-09-03T08:00:00.000Z"),
    ]);
    vi.mocked(mealRepository.findByUser).mockResolvedValue([
      meal("m1", "2026-09-02T12:00:00.000Z"),
    ]);
    vi.mocked(activityRepository.findByUser).mockResolvedValue([]);
    vi.mocked(noteRepository.findByUser).mockResolvedValue([
      note("n1", "2026-09-02T20:00:00.000Z"),
    ]);
  });

  it("queries repositories scoped to the user and period", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(glucoseRepository.findByUser).toHaveBeenCalledWith("u", {
      from: PERIOD.from,
      to: PERIOD.to,
    });
    expect(mealRepository.findByUser).toHaveBeenCalledWith("u", {
      from: PERIOD.from,
      to: PERIOD.to,
    });
  });

  it("builds statistics and insights scoped to the period", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.statistics.glucose?.stats.average).toBe(110);
    expect(result.data.insights).toBeInstanceOf(Array);
    expect(result.data.quality.totalRecords).toBe(3);
  });

  it("normalizes records sorted by timestamp without notes by default", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    if (!result.ok) throw new Error("failed");

    expect(result.data.records.map((r) => r.kind)).toEqual([
      "glucose",
      "meal",
      "glucose",
    ]);
    expect(result.data.records.some((r) => r.kind === "note")).toBe(false);
  });

  it("includes notes when includeNotes is enabled", async () => {
    const result = await getDataContext({
      userId: "u",
      period: PERIOD,
      includeNotes: true,
    });
    if (!result.ok) throw new Error("failed");

    expect(result.data.records.some((r) => r.kind === "note")).toBe(true);
  });

  it("summarizes provenance by source", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    if (!result.ok) throw new Error("failed");

    const manual = result.data.provenance.bySource.find(
      (s) => s.source === "manual"
    );
    const device = result.data.provenance.bySource.find(
      (s) => s.source === "device"
    );
    expect(manual?.count).toBe(2);
    expect(device?.count).toBe(1);
    expect(result.data.provenance.knownSourceRate).toBe(1);
    expect(result.data.provenance.unknownSourceCount).toBe(0);
  });

  it("reports unknown provenance when provenance is absent", async () => {
    vi.mocked(glucoseRepository.findByUser).mockResolvedValue([
      { ...glucose("g1", 100, "2026-09-02T08:00:00.000Z"), provenance: undefined } as GlucoseReading,
    ]);
    vi.mocked(mealRepository.findByUser).mockResolvedValue([]);
    vi.mocked(activityRepository.findByUser).mockResolvedValue([]);
    vi.mocked(noteRepository.findByUser).mockResolvedValue([]);

    const result = await getDataContext({ userId: "u", period: PERIOD });
    if (!result.ok) throw new Error("failed");

    expect(result.data.provenance.unknownSourceCount).toBe(1);
    expect(result.data.provenance.knownSourceRate).toBe(0);
  });
});