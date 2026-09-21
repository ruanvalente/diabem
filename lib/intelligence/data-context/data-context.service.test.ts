import { describe, expect, it, vi, beforeEach } from "vitest";
import { dataContextService, getDataContext } from "./data-context.service";
import { DATA_CONTEXT_VERSION } from "./data-context.types";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";

vi.mock("@/lib/db/repositories/glucose.repository", () => ({
  glucoseRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/meal.repository", () => ({
  mealRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/activity.repository", () => ({
  activityRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/medication.repository", () => ({
  medicationRepository: { findByUser: vi.fn() },
}));
vi.mock("@/lib/db/repositories/note.repository", () => ({
  noteRepository: { findByUser: vi.fn() },
}));

import { glucoseRepository } from "@/lib/db/repositories/glucose.repository";
import { mealRepository } from "@/lib/db/repositories/meal.repository";
import { activityRepository } from "@/lib/db/repositories/activity.repository";
import { medicationRepository } from "@/lib/db/repositories/medication.repository";
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

function activity(id: string, at: string): Activity {
  return {
    id,
    userId: "u",
    type: "walking",
    durationMinutes: 30,
    startedAt: at,
    provenance: { source: "system", recordedAt: at },
    createdAt: at,
    updatedAt: at,
  };
}

function medication(id: string, at: string): Medication {
  return {
    id,
    userId: "u",
    name: "Metformina",
    dosage: "500",
    unit: "mg",
    medicatedAt: at,
    provenance: { source: "manual", recordedAt: at },
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

const PERIOD = {
  start: "2026-09-01T00:00:00.000Z",
  end: "2026-09-07T00:00:00.000Z",
};

describe("dataContextService.getContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(glucoseRepository.findByUser).mockResolvedValue([
      glucose("g1", 100, "2026-09-02T08:00:00.000Z"),
      glucose("g2", 120, "2026-09-03T08:00:00.000Z"),
    ]);
    vi.mocked(mealRepository.findByUser).mockResolvedValue([
      meal("m1", "2026-09-02T12:00:00.000Z"),
    ]);
    vi.mocked(activityRepository.findByUser).mockResolvedValue([
      activity("a1", "2026-09-02T18:00:00.000Z"),
    ]);
    vi.mocked(medicationRepository.findByUser).mockResolvedValue([
      medication("med1", "2026-09-02T08:30:00.000Z"),
    ]);
    vi.mocked(noteRepository.findByUser).mockResolvedValue([
      note("n1", "2026-09-02T20:00:00.000Z"),
    ]);
  });

  it("queries repositories scoped to the user and period", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(glucoseRepository.findByUser).toHaveBeenCalledWith("u", {
      from: PERIOD.start,
      to: PERIOD.end,
    });
    expect(mealRepository.findByUser).toHaveBeenCalledWith("u", {
      from: PERIOD.start,
      to: PERIOD.end,
    });
    expect(medicationRepository.findByUser).toHaveBeenCalledWith("u", {
      from: PERIOD.start,
      to: PERIOD.end,
    });
  });

  it("excludes notes by default and does not query the notes repository", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.records.notes).toEqual([]);
    expect(vi.mocked(noteRepository.findByUser)).not.toHaveBeenCalled();
  });

  it("normalizes records grouped by type including medications", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.records.glucose).toHaveLength(2);
    expect(result.data.records.glucose[0].value).toBe(100);
    expect(result.data.records.meals).toHaveLength(1);
    expect(result.data.records.activities).toHaveLength(1);
    expect(result.data.records.medications).toHaveLength(1);
    expect(result.data.records.medications[0].name).toBe("Metformina");
  });

  it("includes notes only when explicitly requested", async () => {
    const result = await getDataContext({
      userId: "u",
      period: PERIOD,
      include: { notes: true },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.records.notes).toHaveLength(1);
    expect(vi.mocked(noteRepository.findByUser)).toHaveBeenCalledWith("u", {
      from: PERIOD.start,
      to: PERIOD.end,
    });
  });

  it("builds statistics, insights and quality scoped to the period", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.statistics?.glucose?.stats.average).toBe(110);
    expect(result.data.insights).toBeInstanceOf(Array);
    expect(result.data.quality?.totalRecords).toBe(4);
  });

  it("summarizes provenance across all loaded record types", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const manual = result.data.provenance?.bySource.find(
      (s) => s.source === "manual"
    );
    const device = result.data.provenance?.bySource.find(
      (s) => s.source === "device"
    );
    const system = result.data.provenance?.bySource.find(
      (s) => s.source === "system"
    );
    expect(manual?.count).toBe(3);
    expect(device?.count).toBe(1);
    expect(system?.count).toBe(1);
    expect(result.data.provenance?.knownSourceRate).toBe(1);
    expect(result.data.provenance?.totalRecords).toBe(5);
  });

  it("sets the context version and generated timestamp", async () => {
    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.contextVersion).toBe(DATA_CONTEXT_VERSION);
    expect(new Date(result.data.generatedAt).getTime()).not.toBeNaN();
  });

  it("loads only the requested record types", async () => {
    const result = await getDataContext({
      userId: "u",
      period: PERIOD,
      include: {
        glucose: true,
        meals: false,
        activities: false,
        medications: false,
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(glucoseRepository.findByUser).toHaveBeenCalled();
    expect(mealRepository.findByUser).not.toHaveBeenCalled();
    expect(activityRepository.findByUser).not.toHaveBeenCalled();
    expect(medicationRepository.findByUser).not.toHaveBeenCalled();
    expect(result.data.records.meals).toEqual([]);
  });

  it("omits derived sections when not requested", async () => {
    const result = await getDataContext({
      userId: "u",
      period: PERIOD,
      include: {
        glucose: true,
        statistics: false,
        insights: false,
        quality: false,
        provenance: false,
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.statistics).toBeUndefined();
    expect(result.data.insights).toBeUndefined();
    expect(result.data.quality).toBeUndefined();
    expect(result.data.provenance).toBeUndefined();
    expect(result.data.records.glucose).toHaveLength(2);
  });

  it("rejects an inverted period", async () => {
    const result = await getDataContext({
      userId: "u",
      period: { start: PERIOD.end, end: PERIOD.start },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("data final");
  });

  it("rejects an invalid date", async () => {
    const result = await getDataContext({
      userId: "u",
      period: { start: "not-a-date", end: PERIOD.end },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty userId", async () => {
    const result = await getDataContext({ userId: "  ", period: PERIOD });
    expect(result.ok).toBe(false);
  });

  it("rejects a request with nothing selected", async () => {
    const result = await getDataContext({
      userId: "u",
      period: PERIOD,
      include: {
        glucose: false,
        meals: false,
        activities: false,
        medications: false,
        statistics: false,
        insights: false,
        quality: false,
        provenance: false,
      },
    });
    expect(result.ok).toBe(false);
  });

  it("never leaks another user's records into the context", async () => {
    vi.mocked(glucoseRepository.findByUser).mockResolvedValue([
      glucose("g1", 100, "2026-09-02T08:00:00.000Z"),
      { ...glucose("gx", 999, "2026-09-03T08:00:00.000Z"), userId: "other" },
    ]);

    const result = await getDataContext({ userId: "u", period: PERIOD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.records.glucose).toHaveLength(1);
    expect(result.data.records.glucose[0].id).toBe("g1");
  });

  it("exposes the same behaviour through the dataContextService API", async () => {
    const result = await dataContextService.getContext({
      userId: "u",
      period: PERIOD,
    });
    expect(result.ok).toBe(true);
  });
});