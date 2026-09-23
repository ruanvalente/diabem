// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { GlucoseList } from "./glucose-list.ui";
import type { GlucoseReading } from "@/lib/db/types";

function glucoseReading(
  overrides: Partial<GlucoseReading> = {},
): GlucoseReading {
  return {
    id: "g1",
    userId: "user-a",
    value: 128,
    unit: "mg/dL",
    context: "after_meal",
    measuredAt: "2026-09-01T10:00:00.000Z",
    notes: "Após almoço",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("GlucoseList", () => {
  it("renders an empty state when there are no records", () => {
    render(
      <GlucoseList
        records={[]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        emptyState={<p>Nenhuma medição</p>}
      />,
    );

    expect(screen.getByText("Nenhuma medição")).toBeInTheDocument();
  });

  it("groups records by local day", () => {
    render(
      <GlucoseList
        records={[
          glucoseReading({ id: "g1", measuredAt: "2026-09-01T10:00:00.000Z" }),
          glucoseReading({ id: "g2", measuredAt: "2026-09-01T12:00:00.000Z" }),
          glucoseReading({ id: "g3", measuredAt: "2026-09-05T10:00:00.000Z" }),
        ]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("shows the value, range badge, context and notes", () => {
    render(
      <GlucoseList
        records={[glucoseReading()]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("No intervalo")).toBeInTheDocument();
    expect(screen.getByText(/Após a refeição/)).toBeInTheDocument();
    expect(screen.getByText(/Após almoço/)).toBeInTheDocument();
  });

  it("invokes onEdit and onRequestDelete with the record", () => {
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    const record = glucoseReading({ id: "g1", value: 65 });

    render(
      <GlucoseList
        records={[record]}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />,
    );

    const section = screen.getByRole("region");

    fireEvent.click(within(section).getByRole("button", { name: "Editar registro" }));
    expect(onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(
      within(section).getByRole("button", { name: "Excluir registro" }),
    );
    expect(onRequestDelete).toHaveBeenCalledWith(record);
  });
});