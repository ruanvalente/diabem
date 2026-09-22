// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ActivityList } from "./activity-list.ui";
import type { Activity } from "@/lib/db/types";

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    userId: "user-a",
    type: "walking",
    durationMinutes: 30,
    startedAt: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("ActivityList", () => {
  it("renders an empty state when there are no records", () => {
    render(
      <ActivityList
        records={[]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        emptyState={<p>Nenhuma atividade</p>}
      />,
    );

    expect(screen.getByText("Nenhuma atividade")).toBeInTheDocument();
  });

  it("groups records by local day", () => {
    render(
      <ActivityList
        records={[
          activity({ id: "a1", startedAt: "2026-09-01T10:00:00.000Z" }),
          activity({ id: "a2", startedAt: "2026-09-01T12:00:00.000Z" }),
          activity({ id: "a3", startedAt: "2026-09-05T10:00:00.000Z" }),
        ]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("shows the activity type, duration and notes", () => {
    render(
      <ActivityList
        records={[
          activity({
            type: "cycling",
            durationMinutes: 90,
            notes: "No parque",
          }),
        ]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Ciclismo")).toBeInTheDocument();
    expect(screen.getByText(/1h 30min/)).toBeInTheDocument();
    expect(screen.getByText(/No parque/)).toBeInTheDocument();
  });

  it("formats whole hours without a minutes remainder", () => {
    render(
      <ActivityList
        records={[activity({ durationMinutes: 120 })]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/2h$/)).toBeInTheDocument();
  });

  it("invokes onEdit and onRequestDelete with the record", () => {
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    const record = activity({ id: "a1", type: "swimming" });

    render(
      <ActivityList
        records={[record]}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />,
    );

    const section = screen.getByRole("region");

    fireEvent.click(within(section).getByRole("button", { name: "Editar atividade" }));
    expect(onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(
      within(section).getByRole("button", { name: "Excluir atividade" }),
    );
    expect(onRequestDelete).toHaveBeenCalledWith(record);
  });
});