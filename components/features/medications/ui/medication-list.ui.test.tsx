// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MedicationList } from "./medication-list.ui";
import type { Medication } from "@/lib/db/types";

function medication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "m1",
    userId: "user-a",
    name: "Metformina",
    dosage: "500",
    unit: "mg",
    frequency: "2x ao dia",
    route: "oral",
    medicatedAt: "2026-09-01T10:00:00.000Z",
    notes: "Após café",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("MedicationList", () => {
  it("renders an empty state when there are no records", () => {
    render(
      <MedicationList
        records={[]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        emptyState={<p>Nenhum medicamento</p>}
      />,
    );

    expect(screen.getByText("Nenhum medicamento")).toBeInTheDocument();
  });

  it("groups records by local day", () => {
    render(
      <MedicationList
        records={[
          medication({
            id: "m1",
            medicatedAt: "2026-09-01T10:00:00.000Z",
          }),
          medication({
            id: "m2",
            medicatedAt: "2026-09-01T12:00:00.000Z",
          }),
          medication({
            id: "m3",
            medicatedAt: "2026-09-05T10:00:00.000Z",
          }),
        ]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("shows the name, clinical details and notes", () => {
    render(
      <MedicationList
        records={[medication()]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Metformina")).toBeInTheDocument();
    expect(
      screen.getByText(/500 mg · 2x ao dia · oral/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Após café/)).toBeInTheDocument();
  });

  it("renders only the name when no optional details were recorded", () => {
    render(
      <MedicationList
        records={[medication({ dosage: undefined, notes: undefined })]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Metformina")).toBeInTheDocument();
    expect(screen.queryByText(/500 mg/)).not.toBeInTheDocument();
  });

  it("invokes onEdit and onRequestDelete with the record", () => {
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    const record = medication({ id: "m1" });

    render(
      <MedicationList
        records={[record]}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />,
    );

    const section = screen.getByRole("region");

    fireEvent.click(
      within(section).getByRole("button", { name: "Editar medicamento" }),
    );
    expect(onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(
      within(section).getByRole("button", { name: "Excluir medicamento" }),
    );
    expect(onRequestDelete).toHaveBeenCalledWith(record);
  });
});