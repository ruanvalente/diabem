// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-glucose", () => ({
  useGlucose: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

import { GlucoseWidget } from "./glucose.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { toast } from "@/components/ui/toast";
import type { GlucoseReading } from "@/lib/db/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGlucose = vi.mocked(useGlucose);
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
  mockedUseGlucose.mockReturnValue(
    recordsMock() as ReturnType<typeof useGlucose>,
  );
});

describe("GlucoseWidget", () => {
  it("shows the loading skeleton while records are loading", () => {
    mockedUseGlucose.mockReturnValue(
      recordsMock({ isLoading: true }) as ReturnType<typeof useGlucose>,
    );

    render(<GlucoseWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    mockedUseGlucose.mockReturnValue(
      recordsMock({ error: "Erro de teste", reload }) as ReturnType<
        typeof useGlucose
      >,
    );

    render(<GlucoseWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state and offers to register the first reading", () => {
    render(<GlucoseWidget />);

    expect(
      screen.getByText("Ainda não há medições neste período"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar primeira glicemia" }),
    ).toBeInTheDocument();
  });

  it("lists the records and runs the delete flow with a success toast", async () => {
    const remove = vi.fn().mockResolvedValue({ ok: true, data: { id: "g1" } });
    mockedUseGlucose.mockReturnValue(
      recordsMock({ records: [glucoseReading()], remove }) as ReturnType<
        typeof useGlucose
      >,
    );

    render(<GlucoseWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir registro" }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText("Excluir registro?"),
    ).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Registro excluído.",
        type: "success",
      }),
    );
    expect(remove).toHaveBeenCalledWith("g1");
  });

  it("shows an error toast when the delete fails", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Falha ao excluir" });
    mockedUseGlucose.mockReturnValue(
      recordsMock({ records: [glucoseReading()], remove }) as ReturnType<
        typeof useGlucose
      >,
    );

    render(<GlucoseWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir registro" }),
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