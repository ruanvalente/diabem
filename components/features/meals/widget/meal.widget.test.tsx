// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-meals", () => ({
  useMeals: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

import { MealWidget } from "./meal.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { toast } from "@/components/ui/toast";
import type { Meal } from "@/lib/db/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseMeals = vi.mocked(useMeals);
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

function recordsMock(overrides: Record<string, unknown> = {}) {
  return {
    records: [] as Meal[],
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
  mockedUseMeals.mockReturnValue(recordsMock() as ReturnType<typeof useMeals>);
});

describe("MealWidget", () => {
  it("shows the loading skeleton while records are loading", () => {
    mockedUseMeals.mockReturnValue(
      recordsMock({ isLoading: true }) as ReturnType<typeof useMeals>,
    );

    render(<MealWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    mockedUseMeals.mockReturnValue(
      recordsMock({ error: "Erro de teste", reload }) as ReturnType<
        typeof useMeals
      >,
    );

    render(<MealWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state and offers to register the first meal", () => {
    render(<MealWidget />);

    expect(
      screen.getByText("Ainda não há refeições neste período"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar primeira refeição" }),
    ).toBeInTheDocument();
  });

  it("lists the records and applies the type filter", async () => {
    const applyFilters = vi.fn();
    mockedUseMeals.mockReturnValue(
      recordsMock({ records: [meal()], applyFilters }) as ReturnType<
        typeof useMeals
      >,
    );

    render(<MealWidget />);

    expect(screen.getByText(/Arroz, feijão e frango/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lanche" }));

    await waitFor(() =>
      expect(applyFilters).toHaveBeenCalledWith(
        expect.objectContaining({ type: "snack" }),
      ),
    );
  });

  it("lists the records and runs the delete flow with a success toast", async () => {
    const remove = vi.fn().mockResolvedValue({ ok: true, data: { id: "m1" } });
    mockedUseMeals.mockReturnValue(
      recordsMock({ records: [meal()], remove }) as ReturnType<typeof useMeals>,
    );

    render(<MealWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir refeição" }));

    const alertDialog = await screen.findByRole("alertdialog");
    expect(
      within(alertDialog).getByText("Excluir refeição?"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(alertDialog).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Refeição excluída.",
        type: "success",
      }),
    );
    expect(remove).toHaveBeenCalledWith("m1");
  });

  it("shows an error toast when the delete fails", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Falha ao excluir" });
    mockedUseMeals.mockReturnValue(
      recordsMock({ records: [meal()], remove }) as ReturnType<typeof useMeals>,
    );

    render(<MealWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir refeição" }));

    const alertDialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(alertDialog).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Falha ao excluir",
        type: "error",
      }),
    );
  });
});