// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { pickSelectOption } from "@/components/test-utils/select";
import { PeriodRangeFilter } from "./period-range-filter";
import type { PeriodFilterWithCustom, PeriodSelection } from "@/lib/date";

function renderFilter(
  value: PeriodSelection,
  onChange = vi.fn(),
) {
  return { onChange, ...render(<PeriodRangeFilter value={value} onChange={onChange} />) };
}

function trigger() {
  return screen.getByRole("combobox", { name: "Filtrar por período" });
}


describe("PeriodRangeFilter", () => {
  it("shows the current period as a human-readable label, not the raw value", () => {
    renderFilter({ period: "week", custom: null });

    expect(trigger()).toHaveTextContent("7 dias");
    expect(trigger()).not.toHaveTextContent("week");
  });

  it.each<[PeriodFilterWithCustom, string]>([
    ["today", "Hoje"],
    ["week", "7 dias"],
    ["month", "Este mês"],
    ["all", "Todo o período"],
    ["custom", "Personalizado"],
  ])("labels the %s period as %s", (period, label) => {
    renderFilter({ period, custom: null });

    expect(trigger()).toHaveTextContent(label);
  });

  it("reports the picked period with a cleared custom range", () => {
    const { onChange } = renderFilter({ period: "week", custom: null });

    pickSelectOption("Filtrar por período", "Todo o período");

    expect(onChange).toHaveBeenCalledWith({ period: "all", custom: null });
  });

  it("opens the custom range dialog instead of reporting a change", () => {
    const { onChange } = renderFilter({ period: "week", custom: null });

    pickSelectOption("Filtrar por período", "Personalizado");

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Período personalizado" }),
    ).toBeInTheDocument();
  });

  it("reports a valid custom range", () => {
    const { onChange } = renderFilter({ period: "week", custom: null });

    pickSelectOption("Filtrar por período", "Personalizado");
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("De"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(within(dialog).getByLabelText("Até"), {
      target: { value: "2026-09-05" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Aplicar" }));

    expect(onChange).toHaveBeenCalledWith({
      period: "custom",
      custom: { from: "2026-09-01", to: "2026-09-05" },
    });
  });

  it("blocks a reversed custom range with an accessible alert", () => {
    const { onChange } = renderFilter({ period: "week", custom: null });

    pickSelectOption("Filtrar por período", "Personalizado");
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("De"), {
      target: { value: "2026-09-05" },
    });
    fireEvent.change(within(dialog).getByLabelText("Até"), {
      target: { value: "2026-09-01" },
    });

    expect(
      screen.getByText("A data final deve ser igual ou posterior à inicial."),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Aplicar" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
