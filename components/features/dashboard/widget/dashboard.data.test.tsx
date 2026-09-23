import { describe, expect, it } from "vitest";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import { getGlucoseRangeInfo } from "@/lib/health/glucose-range";
import {
  buildDashboardCharts,
  buildDashboardSubtitle,
  buildRecentRecords,
  buildSummaryCards,
  getLastReadingInfo,
} from "./dashboard.data";

function glucose(value: number, measuredAt: string): GlucoseReading {
  return {
    id: `g-${value}-${measuredAt}`,
    userId: "u1",
    value,
    unit: "mg/dL",
    context: "fasting",
    measuredAt,
    createdAt: measuredAt,
    updatedAt: measuredAt,
  };
}

function meal(consumedAt: string): Meal {
  return {
    id: `meal-${consumedAt}`,
    userId: "u1",
    type: "lunch",
    description: "Almoço",
    consumedAt,
    createdAt: consumedAt,
    updatedAt: consumedAt,
  };
}

function activity(startedAt: string, durationMinutes = 30): Activity {
  return {
    id: `act-${startedAt}`,
    userId: "u1",
    type: "walking",
    durationMinutes,
    startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

function note(createdAt: string): Note {
  return {
    id: `note-${createdAt}`,
    userId: "u1",
    content: "Uma observação",
    createdAt,
    updatedAt: createdAt,
  };
}

function medication(medicatedAt: string): Medication {
  return {
    id: `med-${medicatedAt}`,
    userId: "u1",
    name: "Metformina",
    dosage: "500",
    unit: "mg",
    medicatedAt,
    createdAt: medicatedAt,
    updatedAt: medicatedAt,
  };
}

const EMPTY = {
  glucose: [] as GlucoseReading[],
  meals: [] as Meal[],
  activities: [] as Activity[],
  notes: [] as Note[],
  medications: [] as Medication[],
};

describe("buildSummaryCards", () => {
  it("builds the five cards with counts and last-record labels", () => {
    const cards = buildSummaryCards(
      {
        glucose: [glucose(100, "2026-09-01T10:00:00.000Z")],
        meals: [],
        activities: [activity("2026-09-01T07:00:00.000Z", 30)],
        notes: [note("2026-09-01T12:00:00.000Z")],
        medications: [medication("2026-09-01T08:00:00.000Z")],
      },
      "hoje",
    );

    expect(cards).toHaveLength(5);

    const glucoseCard = cards.find((card) => card.href === "/glucose")!;
    expect(glucoseCard.count).toBe(1);
    expect(glucoseCard.last).toMatch(/^100 mg\/dL às \d{2}:\d{2}$/);

    const mealsCard = cards.find((card) => card.href === "/meals")!;
    expect(mealsCard.count).toBe(0);
    expect(mealsCard.last).toBe("Nenhuma refeição hoje");

    const activityCard = cards.find((card) => card.href === "/activity")!;
    expect(activityCard.last).toBe("Caminhada · 30 min");

    const medicationCard = cards.find(
      (card) => card.href === "/medications",
    )!;
    expect(medicationCard.last).toMatch(/^Metformina às \d{2}:\d{2}$/);
  });

  it("uses the adverbial fallback when there are no records", () => {
    const cards = buildSummaryCards(EMPTY, "na última semana");
    expect(cards.map((card) => card.last)).toEqual([
      "Nenhuma medição na última semana",
      "Nenhuma refeição na última semana",
      "Nenhuma atividade na última semana",
      "Nenhuma observação na última semana",
      "Nenhum medicamento na última semana",
    ]);
  });
});

describe("buildDashboardCharts", () => {
  it("builds the four chart cards with summaries", () => {
    const { cards, hasData } = buildDashboardCharts(
      {
        glucose: [
          glucose(100, "2026-09-10T08:00:00.000Z"),
          glucose(120, "2026-09-10T18:00:00.000Z"),
        ],
        meals: [meal("2026-09-10T12:00:00.000Z")],
        activities: [activity("2026-09-10T07:00:00.000Z", 30)],
        notes: [],
        medications: [],
      },
      { from: "2026-09-01T00:00:00.000Z", to: "2026-09-30T00:00:00.000Z" },
    );

    expect(hasData).toBe(true);
    expect(cards).toHaveLength(4);

    const glucoseCard = cards.find((card) => card.kind === "glucose")!;
    expect(glucoseCard.isEmpty).toBe(false);
    expect(glucoseCard.subtitle).toBe("Média 110 mg/dL");
    expect(glucoseCard.summary).toBe(
      "2 medições · média 110 mg/dL · mín 100 · máx 120",
    );

    const activityCard = cards.find((card) => card.kind === "activity")!;
    expect(activityCard.isEmpty).toBe(false);
    expect(activityCard.summary).toBe("30 min de atividade no período.");

    const mealsCard = cards.find((card) => card.kind === "meals")!;
    expect(mealsCard.isEmpty).toBe(false);
    expect(mealsCard.summary).toBe("1 refeição no período.");

    const distributionCard = cards.find(
      (card) => card.kind === "distribution",
    )!;
    expect(distributionCard.isEmpty).toBe(false);
    expect(distributionCard.summary).toBe("4 registros no período.");
  });

  it("marks every card as empty when there is no data", () => {
    const { cards, hasData } = buildDashboardCharts(EMPTY, {
      from: "2026-09-01T00:00:00.000Z",
      to: "2026-09-02T00:00:00.000Z",
    });

    expect(hasData).toBe(false);
    expect(cards.every((card) => card.isEmpty)).toBe(true);
    expect(cards.find((card) => card.kind === "glucose")!.summary).toBe(
      "Sem medições no período.",
    );
  });
});

describe("buildRecentRecords", () => {
  it("merges record types sorted by recency, capped at 8 items", () => {
      const records = {
        glucose: [1, 2, 3, 4, 5].map((value) =>
          glucose(value, `2026-09-01T0${value}:00:00.000Z`),
        ),
        meals: [1, 2, 3, 4, 5].map((hour) =>
          meal(`2026-09-02T0${hour}:00:00.000Z`),
        ),
        activities: [] as Activity[],
        notes: [] as Note[],
        medications: [] as Medication[],
      };

      const items = buildRecentRecords(records);

      expect(items).toHaveLength(8);
      expect(items.filter((item) => item.type === "meal")).toHaveLength(5);
      expect(items.filter((item) => item.type === "glucose")).toHaveLength(3);

      const ats = items.map((item) => item.at);
      expect(ats).toEqual([...ats].sort().reverse());

      const newest = items[0];
      expect(newest.type).toBe("meal");
      expect(newest.detail).toBe("Almoço");

      const oldestGlucose = items.at(-1)!;
      expect(oldestGlucose.detail).toBe("3 mg/dL · Jejum");
    });
});

describe("getLastReadingInfo", () => {
  it("returns null when there is no reading", () => {
    expect(getLastReadingInfo(undefined)).toBeNull();
  });

  it("delegates to the glucose range info of the reading", () => {
    const reading = glucose(100, "2026-09-01T10:00:00.000Z");
    expect(getLastReadingInfo(reading)).toEqual(getGlucoseRangeInfo(100));
  });
});

describe("buildDashboardSubtitle", () => {
  it("builds the default adverbial subtitle", () => {
    expect(
      buildDashboardSubtitle({ period: "today", custom: null }),
    ).toBe("Veja como foi seu acompanhamento hoje.");
    expect(
      buildDashboardSubtitle({ period: "week", custom: null }),
    ).toBe("Veja como foi seu acompanhamento na última semana.");
  });

  it("builds the custom range subtitle", () => {
    const subtitle = buildDashboardSubtitle({
      period: "custom",
      custom: { from: "2026-09-01", to: "2026-09-07" },
    });
    expect(subtitle).toMatch(
      /^Acompanhamento de \d{2}\/\d{2}\/\d{2} a \d{2}\/\d{2}\/\d{2}\.$/,
    );
  });
});