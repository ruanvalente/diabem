// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/features/voice-input/widget/voice-input.widget", () => ({
  VoiceInputWidget: () => null,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

import { MedicationFormDialog } from "./medication-form-dialog.widget";
import { toast } from "@/components/ui/toast";
import type { Medication } from "@/lib/db/types";

const addToast = vi.mocked(toast.add);

function medication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "m1",
    userId: "u1",
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

function renderDialog(
  overrides: Partial<Parameters<typeof MedicationFormDialog>[0]> = {},
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    record: null,
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<MedicationFormDialog {...props} />);
  return props;
}

async function fillValidRecord() {
  await fireEvent.change(screen.getByLabelText("Medicamento"), {
    target: { value: "Metformina" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar medicamento" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MedicationFormDialog", () => {
  it("keeps the submit button disabled until the name is set", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: "Salvar medicamento" }),
    ).toBeDisabled();
  });

  it("submits a new medication and shows the success toast", async () => {
    const props = renderDialog({
      onSubmit: vi.fn().mockResolvedValue({ ok: true, data: medication() }),
    });

    await fillValidRecord();

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Metformina",
          provenanceSource: undefined,
        }),
        undefined,
      ),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Medicamento registrado com sucesso.",
        type: "success",
      }),
    );
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits an updated medication and shows the update toast", async () => {
    const record = medication();
    const props = renderDialog({
      record,
      onSubmit: vi.fn().mockResolvedValue({ ok: true, data: record }),
    });

    expect(
      screen.getByRole("heading", { name: "Editar medicamento" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Medicamento")).toHaveValue("Metformina");

    await fireEvent.change(screen.getByLabelText("Medicamento"), {
      target: { value: "Metformina XR" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Metformina XR",
          provenanceSource: undefined,
        }),
        record,
      ),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Medicamento atualizado com sucesso.",
        type: "success",
      }),
    );
  });

  it("shows a validation error and does not submit on an invalid dosage", async () => {
    const props = renderDialog();

    await fireEvent.change(screen.getByLabelText("Medicamento"), {
      target: { value: "Metformina" },
    });
    await fireEvent.change(screen.getByLabelText("Dosagem (opcional)"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar medicamento" }));

    expect(
      await screen.findByText("Dosagem com formato inválido"),
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