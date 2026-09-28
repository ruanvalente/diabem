// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { pickSelectOption } from "@/components/test-utils/select";
import { PeriodFilter } from "./period-filter";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";

function renderFilter(value: PeriodFilterValue, onChange = vi.fn()) {
  return { onChange, ...render(<PeriodFilter value={value} onChange={onChange} />) };
}

function trigger() {
  return screen.getByRole("combobox", { name: "Filtrar por período" });
}


describe("PeriodFilter", () => {
  it("shows the current period as a human-readable label, not the raw value", () => {
    renderFilter("week");

    expect(trigger()).toHaveTextContent("7 dias");
    expect(trigger()).not.toHaveTextContent("week");
  });

  it.each<[PeriodFilterValue, string]>([
    ["today", "Hoje"],
    ["week", "7 dias"],
    ["month", "Este mês"],
    ["all", "Todo o período"],
  ])("labels the %s period as %s", (period, label) => {
    renderFilter(period);

    expect(trigger()).toHaveTextContent(label);
  });

  it("reports the picked period", () => {
    const { onChange } = renderFilter("week");

    pickSelectOption("Filtrar por período", "Este mês");

    expect(onChange).toHaveBeenCalledWith("month");
  });

  it("closes the popup after a selection", () => {
    renderFilter("week");

    pickSelectOption("Filtrar por período", "Hoje");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("stays controlled, leaving the label to the owner until the value changes", () => {
    renderFilter("week");

    pickSelectOption("Filtrar por período", "Hoje");

    expect(trigger()).toHaveTextContent("7 dias");
  });

  it("updates the label to the picked period once the owner accepts it", () => {
    function Controlled() {
      const [value, setValue] = useState<PeriodFilterValue>("week");
      return <PeriodFilter value={value} onChange={setValue} />;
    }
    render(<Controlled />);

    pickSelectOption("Filtrar por período", "Hoje");

    expect(trigger()).toHaveTextContent("Hoje");
    expect(trigger()).not.toHaveTextContent("week");
  });
});
