// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { GlucoseTab } from "./glucose-tab.ui";
import type { GlucoseStatistics } from "@/lib/analytics/statistics";

function createStats(overrides: Partial<GlucoseStatistics>): GlucoseStatistics {
  return {
    count: 0,
    average: null,
    minimum: null,
    maximum: null,
    inRangePercentage: null,
    trendDirection: "insufficient",
    trendLabel: "Insuficiente",
    contextDistribution: [],
    rangeDistribution: [],
    chartData: {
      points: [],
      count: 0,
      average: null,
      minimum: null,
      maximum: null,
    },
    distributionByTimeOfDay: {
      items: [
        { period: "morning", label: "Manhã", count: 0 },
        { period: "afternoon", label: "Tarde", count: 0 },
        { period: "evening", label: "Noite", count: 0 },
      ],
      total: 0,
    },
    hasEnoughData: false,
    ...overrides,
  };
}

describe("GlucoseTab", () => {
  it("asks for the first readings when the period has no measurements", () => {
    render(<GlucoseTab stats={createStats({ count: 0 })} />);

    expect(screen.getByText("Sem medições neste período")).toBeInTheDocument();
    expect(screen.queryByText("Dados insuficientes")).not.toBeInTheDocument();
  });

  it("asks for a second reading when the period has a single measurement", () => {
    render(
      <GlucoseTab
        stats={createStats({ count: 1, hasEnoughData: false })}
      />,
    );

    expect(screen.getByText("Dados insuficientes")).toBeInTheDocument();
    expect(
      screen.queryByText("Sem medições neste período"),
    ).not.toBeInTheDocument();
  });

  it("shows the record count alongside the insufficient-data notice", () => {
    render(
      <GlucoseTab
        stats={createStats({ count: 1, hasEnoughData: false })}
      />,
    );

    expect(screen.getByText("Registros")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the summary metrics once the period has enough data", () => {
    render(
      <GlucoseTab
        stats={createStats({
          count: 3,
          hasEnoughData: true,
          average: 118.4,
          minimum: 96,
          maximum: 141,
        })}
      />,
    );

    expect(screen.getByText("Média")).toBeInTheDocument();
    expect(screen.getByText("118")).toBeInTheDocument();
    expect(screen.getByText("Mínima")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
    expect(screen.getByText("Máxima")).toBeInTheDocument();
    expect(screen.getByText("141")).toBeInTheDocument();
    expect(screen.queryByText("Dados insuficientes")).not.toBeInTheDocument();
  });

  it("places a placeholder when a metric is unavailable", () => {
    render(
      <GlucoseTab
        stats={createStats({
          count: 3,
          hasEnoughData: true,
          average: null,
          minimum: 96,
          maximum: 141,
        })}
      />,
    );

    expect(screen.getByText("Média")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
  });
});
