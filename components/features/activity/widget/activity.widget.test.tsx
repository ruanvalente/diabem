// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-activities", () => ({
  useActivities: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

import { ActivityWidget } from "./activity.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { toast } from "@/components/ui/toast";
import type { Activity } from "@/lib/db/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseActivities = vi.mocked(useActivities);
const addToast = vi.mocked(toast.add);

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    userId: "u1",
    type: "walking",
    durationMinutes: 30,
    startedAt: "2026-09-01T10:00:00.000Z",
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
  mockedUseActivities.mockReturnValue(
    recordsMock() as ReturnType<typeof useActivities>,
  );
});

describe("ActivityWidget", () => {
  it("shows the loading skeleton while records are loading", () => {
    mockedUseActivities.mockReturnValue(
      recordsMock({ isLoading: true }) as ReturnType<typeof useActivities>,
    );

    render(<ActivityWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    mockedUseActivities.mockReturnValue(
      recordsMock({ error: "Erro de teste", reload }) as ReturnType<
        typeof useActivities
      >,
    );

    render(<ActivityWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state and offers to register the first activity", () => {
    render(<ActivityWidget />);

    expect(
      screen.getByText("Ainda não há atividades neste período"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar primeira atividade" }),
    ).toBeInTheDocument();
  });

  it("lists the records and runs the delete flow with a success toast", async () => {
    const remove = vi.fn().mockResolvedValue({ ok: true, data: { id: "a1" } });
    mockedUseActivities.mockReturnValue(
      recordsMock({ records: [activity()], remove }) as ReturnType<
        typeof useActivities
      >,
    );

    render(<ActivityWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir atividade" }),
    );

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText("Excluir atividade?"),
    ).toBeInTheDocument();

    fireEvent.click(within(alertDialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Atividade excluída.",
        type: "success",
      }),
    );
    expect(remove).toHaveBeenCalledWith("a1");
  });

  it("shows an error toast when the delete fails", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Falha ao excluir" });
    mockedUseActivities.mockReturnValue(
      recordsMock({ records: [activity()], remove }) as ReturnType<
        typeof useActivities
      >,
    );

    render(<ActivityWidget />);

    fireEvent.click(
      screen.getByRole("button", { name: "Excluir atividade" }),
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