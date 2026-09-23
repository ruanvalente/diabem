// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DataScopeCheckboxes } from "./data-scope-checkboxes.ui";

const DEFAULT_SCOPE = {
  glucose: true,
  meals: false,
  activities: true,
  notes: false,
  medications: true,
};

describe("DataScopeCheckboxes", () => {
  it("renders a checkbox per data type", () => {
    render(<DataScopeCheckboxes scope={DEFAULT_SCOPE} onToggle={vi.fn()} />);

    expect(
      screen.getByRole("checkbox", { name: "Glicemia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Alimentação" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Atividade" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Observações" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Medicamentos" }),
    ).toBeInTheDocument();
  });

  it("reflects the given scope in the checked state", () => {
    render(<DataScopeCheckboxes scope={DEFAULT_SCOPE} onToggle={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Glicemia" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Alimentação" }),
    ).not.toBeChecked();
  });

  it("calls onToggle with the scope key when a checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(<DataScopeCheckboxes scope={DEFAULT_SCOPE} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Observações" }));

    expect(onToggle).toHaveBeenCalledWith("notes");
  });
});
