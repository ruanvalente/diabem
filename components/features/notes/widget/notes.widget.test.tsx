// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-notes", () => ({
  useNotes: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/components/features/voice-input/widget/voice-input.widget", () => ({
  VoiceInputWidget: () => null,
}));

import { NotesWidget } from "./notes.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { toast } from "@/components/ui/toast";
import type { Note } from "@/lib/db/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseNotes = vi.mocked(useNotes);
const addToast = vi.mocked(toast.add);

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "n1",
    userId: "u1",
    content: "Medição antes do café",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function recordsMock(overrides: Record<string, unknown> = {}) {
  return {
    records: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
    applyFilters: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: { id: "u1" },
  } as ReturnType<typeof useAuth>);
  mockedUseNotes.mockReturnValue(recordsMock() as ReturnType<typeof useNotes>);
});

describe("NotesWidget", () => {
  it("shows the loading skeleton while records are loading", () => {
    mockedUseNotes.mockReturnValue(
      recordsMock({ isLoading: true }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    mockedUseNotes.mockReturnValue(
      recordsMock({ error: "Erro de teste", reload }) as ReturnType<
        typeof useNotes
      >,
    );

    render(<NotesWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when there are no records", () => {
    render(<NotesWidget />);

    expect(
      screen.getByText("Nenhuma observação por aqui"),
    ).toBeInTheDocument();
  });

  it("creates a note, clears the composer and shows a success toast", async () => {
    const create = vi.fn().mockResolvedValue({ ok: true, data: note() });
    mockedUseNotes.mockReturnValue(
      recordsMock({ create }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    fireEvent.change(screen.getByRole("textbox", { name: "Nova observação" }), {
      target: { value: "Tarde tranquila" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar observação" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ content: "Tarde tranquila" }),
    );
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Observação salva neste dispositivo.",
        type: "success",
      }),
    );
    expect(screen.getByRole("textbox", { name: "Nova observação" })).toHaveValue("");
  });

  it("shows an error toast when the create fails", async () => {
    const create = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Não foi possível salvar" });
    mockedUseNotes.mockReturnValue(
      recordsMock({ create }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    fireEvent.change(screen.getByRole("textbox", { name: "Nova observação" }), {
      target: { value: "Tarde tranquila" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar observação" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível salvar",
        type: "error",
      }),
    );
    expect(screen.getByRole("textbox", { name: "Nova observação" })).toHaveValue(
      "Tarde tranquila",
    );
  });

  it("shows an inline validation error and does not submit an oversized note", async () => {
    const create = vi.fn();
    mockedUseNotes.mockReturnValue(
      recordsMock({ create }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    fireEvent.change(screen.getByRole("textbox", { name: "Nova observação" }), {
      target: { value: "a".repeat(2001) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar observação" }));

    expect(await screen.findByText("Observação muito longa")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("updates a note through the edit dialog with a success toast", async () => {
    const record = note();
    const update = vi.fn().mockResolvedValue({ ok: true, data: record });
    mockedUseNotes.mockReturnValue(
      recordsMock({ records: [record], update }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Editar observação" }),
    );

    const dialog = await screen.findByRole("dialog");
    const textarea = within(dialog).getByLabelText("Conteúdo");
    expect(textarea).toHaveValue(record.content);

    fireEvent.change(textarea, { target: { value: "Conteúdo revisado" } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(record.id, {
        content: "Conteúdo revisado",
      }),
    );
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Observação atualizada com sucesso.",
        type: "success",
      }),
    );
  });

  it("runs the delete flow with a success toast", async () => {
    const remove = vi.fn().mockResolvedValue({ ok: true, data: { id: "n1" } });
    mockedUseNotes.mockReturnValue(
      recordsMock({ records: [note()], remove }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir observação" }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText("Excluir observação?"),
    ).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Observação excluída.",
        type: "success",
      }),
    );
    expect(remove).toHaveBeenCalledWith("n1");
  });

  it("shows an error toast when the delete fails", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Falha ao excluir" });
    mockedUseNotes.mockReturnValue(
      recordsMock({ records: [note()], remove }) as ReturnType<typeof useNotes>,
    );

    render(<NotesWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir observação" }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(alertDialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Falha ao excluir",
        type: "error",
      }),
    );
  });
});