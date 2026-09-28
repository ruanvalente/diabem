// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { MealsTab } from "./meals-tab.ui";
import { ActivityTab } from "./activity-tab.ui";
import type { MealStatistics, ActivityStatistics } from "@/lib/analytics/statistics";

const EMPTY_TIME_OF_DAY = {
  items: [
    { period: "morning" as const, label: "Manhã", count: 0 },
    { period: "afternoon" as const, label: "Tarde", count: 0 },
    { period: "evening" as const, label: "Noite", count: 0 },
  ],
  total: 0,
};

function createMealStats(
  overrides: Partial<MealStatistics> = {},
): MealStatistics {
  return {
    totalCount: 0,
    byType: [],
    distributionByTimeOfDay: EMPTY_TIME_OF_DAY,
    hasEnoughData: false,
    ...overrides,
  };
}

function createActivityStats(
  overrides: Partial<ActivityStatistics> = {},
): ActivityStatistics {
  return {
    totalCount: 0,
    totalMinutes: 0,
    averageMinutesPerDay: null,
    byType: [],
    chartData: { days: [], totalMinutes: 0 },
    hasEnoughData: false,
    ...overrides,
  };
}

describe("MealsTab distribution rows", () => {
  it("asks for the first meals when the period has none", () => {
    render(<MealsTab stats={createMealStats()} />);

    expect(screen.getByText("Nenhuma refeição registrada")).toBeInTheDocument();
  });

  it("exposes one progressbar per meal type", () => {
    render(
      <MealsTab
        stats={createMealStats({
          hasEnoughData: true,
          totalCount: 5,
          byType: [
            { type: "breakfast", label: "Café da manhã", count: 3 },
            { type: "lunch", label: "Almoço", count: 2 },
          ],
        })}
      />,
    );

    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("aria-label", "Café da manhã");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "60");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "40");
  });

  it("keeps the singular and plural forms in the row value", () => {
    render(
      <MealsTab
        stats={createMealStats({
          hasEnoughData: true,
          totalCount: 2,
          byType: [
            { type: "breakfast", label: "Café da manhã", count: 1 },
            { type: "lunch", label: "Almoço", count: 1 },
          ],
        })}
      />,
    );

    expect(screen.getAllByText("1 refeição")).toHaveLength(2);
  });

  it("uses the plural form for repeated meal types", () => {
    render(
      <MealsTab
        stats={createMealStats({
          hasEnoughData: true,
          totalCount: 3,
          byType: [{ type: "lunch", label: "Almoço", count: 3 }],
        })}
      />,
    );

    expect(screen.getByText("3 refeições")).toBeInTheDocument();
  });
});

describe("ActivityTab distribution rows", () => {
  it("asks for the first activities when the period has none", () => {
    render(<ActivityTab stats={createActivityStats()} />);

    expect(
      screen.getByText("Nenhuma atividade registrada"),
    ).toBeInTheDocument();
  });

  it("sizes the bar by minutes while labelling it with the record count", () => {
    render(
      <ActivityTab
        stats={createActivityStats({
          hasEnoughData: true,
          totalCount: 3,
          totalMinutes: 120,
          byType: [
            { type: "walk", label: "Caminhada", count: 1, totalMinutes: 90 },
            { type: "run", label: "Corrida", count: 2, totalMinutes: 30 },
          ],
        })}
      />,
    );

    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    // Bar width is the share of minutes: 90/120 then 30/120.
    expect(bars[0]).toHaveAttribute("aria-valuenow", "75");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "25");
    expect(bars[0]).toHaveAttribute("aria-label", "Caminhada");
  });

  it("keeps the record count and the duration in the row value", () => {
    render(
      <ActivityTab
        stats={createActivityStats({
          hasEnoughData: true,
          totalCount: 2,
          totalMinutes: 60,
          byType: [
            { type: "walk", label: "Caminhada", count: 1, totalMinutes: 60 },
          ],
        })}
      />,
    );

    expect(screen.getByText("1 registro · 1h")).toBeInTheDocument();
  });

  it("renders no progressbar when no activity is in the period", () => {
    render(
      <ActivityTab
        stats={createActivityStats({
          hasEnoughData: true,
          totalCount: 1,
          totalMinutes: 30,
          byType: [],
        })}
      />,
    );

    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
  });
});
