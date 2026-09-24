// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-medications", () => ({
  useMedications: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

import { MedicationWidget } from "./medication.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useMedications } from "@/lib/health/hooks/use-medications";
import { toast } from "@/components/ui/toast";
import type { Medication } from "@/lib/db/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseMedications = vi.mocked(useMedications);
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
  mockedUseMedications.mockReturnValue(
    recordsMock() as ReturnType<typeof useMedications>,
  );
});

describe("MedicationWidget", () => {
  it("shows the loading skeleton while records are loading", () => {
    mockedUseMedications.mockReturnValue(
      recordsMock({ isLoading: true }) as ReturnType<typeof useMedications>,
    );

    render(<MedicationWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    mockedUseMedications.mockReturnValue(
      recordsMock({ error: "Erro de teste", reload }) as ReturnType<
        typeof useMedications
      >,
    );

    render(<MedicationWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state and offers to register the first medication", () => {
    render(<MedicationWidget />);

    expect(
      screen.getByText("Ainda não há medicamentos neste período"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar primeiro medicamento" }),
    ).toBeInTheDocument();
  });

  it("lists the records and runs the delete flow with a success toast", async () => {
    const remove = vi.fn().mockResolvedValue({ ok: true, data: { id: "m1" } });
    mockedUseMedications.mockReturnValue(
      recordsMock({ records: [medication()], remove }) as ReturnType<
        typeof useMedications
      >,
    );

    render(<MedicationWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir medicamento" }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText("Excluir medicamento?"),
    ).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Medicamento excluído.",
        type: "success",
      }),
    );
    expect(remove).toHaveBeenCalledWith("m1");
  });

  it("shows an error toast when the delete fails", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Falha ao excluir" });
    mockedUseMedications.mockReturnValue(
      recordsMock({ records: [medication()], remove }) as ReturnType<
        typeof useMedications
      >,
    );

    render(<MedicationWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir medicamento" }),
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