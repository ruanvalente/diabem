// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { NoteList } from "./note-list.ui";
import type { Note } from "@/lib/db/types";

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "n1",
    userId: "user-a",
    content: "Medição antes do café",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("NoteList", () => {
  it("renders an empty state when there are no records", () => {
    render(
      <NoteList
        records={[]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        emptyState={<p>Nenhuma observação</p>}
      />,
    );

    expect(screen.getByText("Nenhuma observação")).toBeInTheDocument();
  });

  it("groups records by local day", () => {
    render(
      <NoteList
        records={[
          note({ id: "n1", createdAt: "2026-09-01T10:00:00.000Z" }),
          note({ id: "n2", createdAt: "2026-09-01T12:00:00.000Z" }),
          note({ id: "n3", createdAt: "2026-09-05T10:00:00.000Z" }),
        ]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("renders the note content and its time", () => {
    render(
      <NoteList
        records={[note({ content: "Almocei leve" })]}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Almocei leve")).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("invokes onEdit and onRequestDelete with the record", () => {
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    const record = note({ id: "n1" });

    render(
      <NoteList
        records={[record]}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />,
    );

    const section = screen.getByRole("region");

    fireEvent.click(
      within(section).getByRole("button", { name: "Editar observação" }),
    );
    expect(onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(
      within(section).getByRole("button", { name: "Excluir observação" }),
    );
    expect(onRequestDelete).toHaveBeenCalledWith(record);
  });
});