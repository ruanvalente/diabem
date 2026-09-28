// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-glucose", () => ({
  useGlucose: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-meals", () => ({
  useMeals: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-activities", () => ({
  useActivities: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-notes", () => ({
  useNotes: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-medications", () => ({
  useMedications: vi.fn(),
}));

import { useStatistics } from "./use-statistics";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useMedications } from "@/lib/health/hooks/use-medications";
import type { Medication } from "@/lib/db/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGlucose = vi.mocked(useGlucose);
const mockedUseMeals = vi.mocked(useMeals);
const mockedUseActivities = vi.mocked(useActivities);
const mockedUseNotes = vi.mocked(useNotes);
const mockedUseMedications = vi.mocked(useMedications);

type MockEntity = {
  records: unknown[];
  isLoading: boolean;
  error: string | null;
  reload: ReturnType<typeof vi.fn>;
  applyFilters: ReturnType<typeof vi.fn>;
};

function createEntity(overrides: Partial<MockEntity> = {}): MockEntity {
  return {
    records: [],
    isLoading: false,
    error: null,
    reload: vi.fn(async () => {}),
    applyFilters: vi.fn(async () => {}),
    ...overrides,
  };
}

function createMedication(name: string, id: string): Medication {
  return {
    id,
    name,
    route: "oral",
    dosage: "1",
    medicatedAt: "2026-09-01T10:00:00.000Z",
    notes: "",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  } as Medication;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue({ user: { id: "user-a" } } as never);
  mockedUseGlucose.mockReturnValue(createEntity() as never);
  mockedUseMeals.mockReturnValue(createEntity() as never);
  mockedUseActivities.mockReturnValue(createEntity() as never);
  mockedUseNotes.mockReturnValue(createEntity() as never);
  mockedUseMedications.mockReturnValue(createEntity() as never);
});

describe("useStatistics", () => {
  it("applies the resolved period to every record source", async () => {
    const glucose = createEntity();
    const meals = createEntity();
    const activities = createEntity();
    const notes = createEntity();
    const medications = createEntity();
    mockedUseGlucose.mockReturnValue(glucose as never);
    mockedUseMeals.mockReturnValue(meals as never);
    mockedUseActivities.mockReturnValue(activities as never);
    mockedUseNotes.mockReturnValue(notes as never);
    mockedUseMedications.mockReturnValue(medications as never);

    const { rerender } = renderHook(() => useStatistics());
    rerender();

    await waitFor(() => expect(glucose.applyFilters).toHaveBeenCalled());
    const [range] = glucose.applyFilters.mock.calls[0];
    expect(range).toEqual(expect.objectContaining({ to: expect.any(String) }));
    expect(meals.applyFilters).toHaveBeenCalledWith(range);
    expect(activities.applyFilters).toHaveBeenCalledWith(range);
    expect(notes.applyFilters).toHaveBeenCalledWith(range);
    expect(medications.applyFilters).toHaveBeenCalledWith(range);
  });

  it("does not read any record while there is no authenticated user", () => {
    mockedUseAuth.mockReturnValue({ user: null } as never);
    const glucose = createEntity();
    mockedUseGlucose.mockReturnValue(glucose as never);

    renderHook(() => useStatistics());

    expect(glucose.applyFilters).not.toHaveBeenCalled();
  });

  it("reports loading while any record source is loading", () => {
    mockedUseMeals.mockReturnValue(
      createEntity({ isLoading: true }) as never
    );

    const { result } = renderHook(() => useStatistics());

    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces the first error reported by a record source", () => {
    mockedUseGlucose.mockReturnValue(
      createEntity({ error: "Falha ao ler glicemia" }) as never
    );
    mockedUseActivities.mockReturnValue(
      createEntity({ error: "Falha ao ler atividades" }) as never
    );

    const { result } = renderHook(() => useStatistics());

    expect(result.current.error).toBe("Falha ao ler glicemia");
  });

  it("skips sources without an error when picking the reported one", () => {
    mockedUseGlucose.mockReturnValue(createEntity() as never);
    mockedUseNotes.mockReturnValue(
      createEntity({ error: "Falha ao ler anotações" }) as never
    );

    const { result } = renderHook(() => useStatistics());

    expect(result.current.error).toBe("Falha ao ler anotações");
  });

  it("reloads every record source", async () => {
    const glucose = createEntity();
    const notes = createEntity();
    mockedUseGlucose.mockReturnValue(glucose as never);
    mockedUseNotes.mockReturnValue(notes as never);

    const { result } = renderHook(() => useStatistics());

    act(() => result.current.reload());

    await waitFor(() => expect(glucose.reload).toHaveBeenCalled());
    expect(notes.reload).toHaveBeenCalled();
  });

  it("lists the medication names without duplicates, sorted in pt-BR", () => {
    mockedUseMedications.mockReturnValue(
      createEntity({
        records: [
          createMedication("Metformina", "m1"),
          createMedication("insulina", "m2"),
          createMedication("Metformina", "m3"),
        ],
      }) as never
    );

    const { result } = renderHook(() => useStatistics());

    expect(result.current.medicationNames).toEqual([
      "insulina",
      "Metformina",
    ]);
  });

  it("narrows the medication statistics to the selected medication", () => {
    mockedUseMedications.mockReturnValue(
      createEntity({
        records: [
          createMedication("Metformina", "m1"),
          createMedication("Insulina", "m2"),
          createMedication("Insulina", "m3"),
        ],
      }) as never
    );

    const { result } = renderHook(() => useStatistics());

    act(() => result.current.setMedicationFilter("Insulina"));

    expect(result.current.medicationFilter).toBe("Insulina");
    expect(result.current.data.medications.totalCount).toBe(2);
    expect(result.current.data.medications.distinctCount).toBe(1);
  });

  it("falls back to \"all\" when the selected medication leaves the period", () => {
    mockedUseMedications.mockReturnValue(
      createEntity({ records: [createMedication("Metformina", "m1")] }) as never
    );

    const { result, rerender } = renderHook(() => useStatistics());

    act(() => result.current.setMedicationFilter("Metformina"));
    expect(result.current.medicationFilter).toBe("Metformina");

    mockedUseMedications.mockReturnValue(createEntity({ records: [] }) as never);
    rerender();

    expect(result.current.medicationNames).toEqual([]);
    expect(result.current.medicationFilter).toBe("all");
  });

  it("keeps \"all\" selected without narrowing the medication statistics", () => {
    mockedUseMedications.mockReturnValue(
      createEntity({
        records: [
          createMedication("Metformina", "m1"),
          createMedication("Insulina", "m2"),
        ],
      }) as never
    );

    const { result } = renderHook(() => useStatistics());

    expect(result.current.medicationFilter).toBe("all");
    expect(result.current.data.medications.totalCount).toBe(2);
  });
});
