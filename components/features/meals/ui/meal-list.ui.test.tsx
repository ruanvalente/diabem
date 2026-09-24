// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MealList } from "./meal-list.ui";
import type { Meal } from "@/lib/db/types";

function meal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "m1",
    userId: "user-a",
    type: "lunch",
    description: "Arroz, feijão e frango",
    consumedAt: "2026-09-01T10:00:00.000Z",
    notes: "Refeição leve",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("MealList", () => {
  it("renders an empty state when there are no records", () => {
    render(
      <MealList
        records={[]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        emptyState={<p>Nenhuma refeição</p>}
      />,
    );

    expect(screen.getByText("Nenhuma refeição")).toBeInTheDocument();
  });

  it("groups records by local day", () => {
    render(
      <MealList
        records={[
          meal({ id: "m1", consumedAt: "2026-09-01T06:00:00.000Z" }),
          meal({ id: "m2", consumedAt: "2026-09-01T06:02:00.000Z" }),
          meal({ id: "m3", consumedAt: "2026-09-03T06:00:00.000Z" }),
        ]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("shows the type label, time, description and notes", () => {
    render(
      <MealList
        records={[meal()]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Almoço")).toBeInTheDocument();
    expect(screen.getByText(/Arroz, feijão e frango/)).toBeInTheDocument();
    expect(screen.getByText(/Refeição leve/)).toBeInTheDocument();
  });

  it("invokes onEdit and onRequestDelete with the record", () => {
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    const record = meal({ id: "m1" });

    render(
      <MealList
        records={[record]}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />,
    );

    const section = screen.getByRole("region");

    fireEvent.click(
      within(section).getByRole("button", { name: "Editar refeição" }),
    );
    expect(onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(
      within(section).getByRole("button", { name: "Excluir refeição" }),
    );
    expect(onRequestDelete).toHaveBeenCalledWith(record);
  });
});