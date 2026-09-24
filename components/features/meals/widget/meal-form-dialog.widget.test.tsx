// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/features/voice-input/widget/voice-input.widget", () => ({
  VoiceInputWidget: () => null,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

import { MealFormDialog } from "./meal-form-dialog.widget";
import { toast } from "@/components/ui/toast";
import type { Meal } from "@/lib/db/types";

const addToast = vi.mocked(toast.add);

function meal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "m1",
    userId: "u1",
    type: "lunch",
    description: "Arroz, feijão e frango",
    consumedAt: "2026-09-01T10:00:00.000Z",
    notes: "Refeição leve",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function renderDialog(
  overrides: Partial<Parameters<typeof MealFormDialog>[0]> = {},
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    record: null,
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<MealFormDialog {...props} />);
  return props;
}

async function fillValidRecord() {
  fireEvent.click(screen.getByRole("button", { name: "Lanche" }));
  fireEvent.change(screen.getByLabelText("Descrição"), {
    target: { value: "Torrada com queijo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar refeição" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MealFormDialog", () => {
  it("keeps the submit button disabled until type and description are set", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: "Salvar refeição" }),
    ).toBeDisabled();
  });

  it("submits a new meal and shows the success toast", async () => {
    const props = renderDialog({
      onSubmit: vi.fn().mockResolvedValue({ ok: true, data: meal() }),
    });

    await fillValidRecord();

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "snack",
          description: "Torrada com queijo",
          consumedAtLocal: expect.any(String),
        }),
        undefined,
      ),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Refeição registrada com sucesso.",
        type: "success",
      }),
    );
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits an updated meal and shows the update toast", async () => {
    const record = meal();
    const props = renderDialog({
      record,
      onSubmit: vi.fn().mockResolvedValue({ ok: true, data: record }),
    });

    expect(
      screen.getByRole("heading", { name: "Editar refeição" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toHaveValue("Arroz, feijão e frango");

    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Salada e peixe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "lunch",
          description: "Salada e peixe",
          consumedAtLocal: expect.any(String),
        }),
        record,
      ),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Refeição atualizada com sucesso.",
        type: "success",
      }),
    );
  });

  it("shows a validation error and does not submit on an invalid description", async () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Lanche" }));
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar refeição" }));

    expect(
      await screen.findByText("Descreva o que você comeu"),
    ).toBeInTheDocument();
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error toast when the submit fails", async () => {
    const props = renderDialog({
      onSubmit: vi.fn().mockResolvedValue({
        ok: false,
        error: "Não foi possível salvar",
      }),
    });

    await fillValidRecord();

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível salvar",
        type: "error",
      }),
    );
    expect(props.onOpenChange).not.toHaveBeenCalledWith(false);
  });
});