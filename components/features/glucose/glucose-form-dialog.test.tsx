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

import { GlucoseFormDialog } from "./glucose-form-dialog";
import { toast } from "@/components/ui/toast";
import type { GlucoseReading } from "@/lib/db/types";

const addToast = vi.mocked(toast.add);

function glucoseReading(
  overrides: Partial<GlucoseReading> = {},
): GlucoseReading {
  return {
    id: "g1",
    userId: "u1",
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

function renderDialog(overrides: Partial<Parameters<typeof GlucoseFormDialog>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    record: null,
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<GlucoseFormDialog {...props} />);
  return props;
}

async function fillValidRecord() {
  await fireEvent.change(screen.getByLabelText("Valor da medição"), {
    target: { value: "128" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Após a refeição" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar registro" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GlucoseFormDialog", () => {
  it("keeps the submit button disabled until value and context are set", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: "Salvar registro" }),
    ).toBeDisabled();
  });

  it("submits a new reading and shows the success toast", async () => {
    const props = renderDialog({
      onSubmit: vi.fn().mockResolvedValue({ ok: true, data: glucoseReading() }),
    });

    await fillValidRecord();

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 128,
          context: "after_meal",
          provenanceSource: undefined,
        }),
        undefined,
      ),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Glicemia registrada com sucesso.",
        type: "success",
      }),
    );
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits an updated reading and shows the update toast", async () => {
    const record = glucoseReading();
    const props = renderDialog({
      record,
      onSubmit: vi.fn().mockResolvedValue({ ok: true, data: record }),
    });

    expect(screen.getByRole("heading", { name: "Editar glicemia" })).toBeInTheDocument();
    expect(screen.getByLabelText("Valor da medição")).toHaveValue(128);

    await fireEvent.change(screen.getByLabelText("Valor da medição"), {
      target: { value: "110" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 110,
          context: "after_meal",
          provenanceSource: undefined,
        }),
        record,
      ),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Glicemia atualizada com sucesso.",
        type: "success",
      }),
    );
  });

  it("shows a validation error and does not submit on an invalid value", async () => {
    const props = renderDialog();

    await fireEvent.change(screen.getByLabelText("Valor da medição"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Jejum" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar registro" }));

    expect(
      await screen.findByText("Informe um valor maior que zero"),
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