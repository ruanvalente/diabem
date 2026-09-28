// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { pickSelectOption } from "@/components/test-utils/select";
import { MedicationsTab } from "./medications-tab.ui";
import type { MedicationStatistics } from "@/lib/analytics/statistics";

function createStats(
  overrides: Partial<MedicationStatistics> = {},
): MedicationStatistics {
  return {
    totalCount: 0,
    distinctCount: 0,
    byRoute: [],
    byName: [],
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

const NAMES = ["Metformina", "Losartana"];

function renderTab(filter: string, onFilterChange = vi.fn()) {
  return {
    onFilterChange,
    ...render(
      <MedicationsTab
        stats={createStats({
          hasEnoughData: true,
          totalCount: 4,
          distinctCount: 2,
        })}
        names={NAMES}
        filter={filter}
        onFilterChange={onFilterChange}
      />,
    ),
  };
}

function trigger() {
  return screen.getByRole("combobox", { name: "Filtrar por medicamento" });
}

function triggerValue() {
  return trigger().querySelector("[data-slot='select-value']");
}

describe("MedicationsTab", () => {
  it("asks for the first medication when the period has no records", () => {
    render(
      <MedicationsTab
        stats={createStats()}
        names={[]}
        filter="all"
        onFilterChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Nenhum medicamento registrado"),
    ).toBeInTheDocument();
  });

  it("labels the catch-all filter as Todos, not the raw all value", () => {
    renderTab("all");

    expect(trigger()).toHaveTextContent("Todos");
    expect(trigger()).not.toHaveTextContent("all");
  });

  it("labels a selected medication with its own name", () => {
    renderTab("Metformina");

    expect(trigger()).toHaveTextContent("Metformina");
  });

  it("reports the picked medication", () => {
    const { onFilterChange } = renderTab("all");

    pickSelectOption("Filtrar por medicamento", "Losartana");

    expect(onFilterChange).toHaveBeenCalledWith("Losartana");
  });

  it("returns to the catch-all filter", () => {
    const { onFilterChange } = renderTab("Metformina");

    pickSelectOption("Filtrar por medicamento", "Todos");

    expect(onFilterChange).toHaveBeenCalledWith("all");
  });

  it("marks the catch-all as a placeholder while nothing is selected", () => {
    renderTab("");

    expect(triggerValue()).toHaveAttribute("data-placeholder");
    expect(triggerValue()).toHaveTextContent("Todos");
  });

  it("stops marking the catch-all as a placeholder once it is selected", () => {
    renderTab("all");

    expect(triggerValue()).not.toHaveAttribute("data-placeholder");
  });

  it("hides the filter when no medication is selectable", () => {
    render(
      <MedicationsTab
        stats={createStats({ hasEnoughData: true, totalCount: 4, distinctCount: 1 })}
        names={[]}
        filter="all"
        onFilterChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("combobox", { name: "Filtrar por medicamento" }),
    ).not.toBeInTheDocument();
  });
});
