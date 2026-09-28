// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-timeline", () => ({
  useTimeline: vi.fn(),
}));

import { pickSelectOption } from "@/components/test-utils/select";
import { TimelineWidget } from "./timeline.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useTimeline } from "@/lib/health/hooks/use-timeline";
import { resolvePeriodSelectionRange } from "@/lib/date";
import type { TimelineEvent } from "@/lib/health/types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseTimeline = vi.mocked(useTimeline);

const WEEK_RANGE = resolvePeriodSelectionRange({
  period: "week",
  custom: null,
});

const FILTERED_EMPTY_DESCRIPTION =
  "Não há registros para o período e tipos selecionados. Ajuste o filtro para encontrar mais resultados.";

const UNFILTERED_EMPTY_DESCRIPTION =
  "Seus registros de glicemia, refeições, atividades, observações e medicamentos vão aparecer aqui em ordem cronológica.";

const ALL_RANGE = resolvePeriodSelectionRange({ period: "all", custom: null });


function timelineEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    type: "note",
    id: "n1",
    at: "2026-09-01T13:30:00.000Z",
    data: {
      userId: "u1",
      id: "n1",
      content: "Senti-me bem hoje",
      createdAt: "2026-09-01T13:30:00.000Z",
      updatedAt: "2026-09-01T13:30:00.000Z",
    },
    ...overrides,
  } as TimelineEvent;
}

function recordsMock(overrides: Record<string, unknown> = {}) {
  return {
    records: [] as TimelineEvent[],
    isLoading: false,
    error: null as string | null,
    reload: vi.fn(),
    applyFilters: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: { id: "u1" },
  } as ReturnType<typeof useAuth>);
  mockedUseTimeline.mockReturnValue(
    recordsMock() as ReturnType<typeof useTimeline>,
  );
});

describe("TimelineWidget", () => {
  it("queries the timeline for the signed-in user over the default week range", () => {
    render(<TimelineWidget />);

    expect(mockedUseTimeline).toHaveBeenCalledWith("u1", WEEK_RANGE);
  });

  it("waits for a user before querying the timeline", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
    } as ReturnType<typeof useAuth>);

    render(<TimelineWidget />);

    expect(mockedUseTimeline).toHaveBeenCalledWith(null, WEEK_RANGE);
  });

  it("shows the loading skeleton while records are loading", () => {
    mockedUseTimeline.mockReturnValue(
      recordsMock({ isLoading: true }) as ReturnType<typeof useTimeline>,
    );

    render(<TimelineWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    mockedUseTimeline.mockReturnValue(
      recordsMock({ error: "Erro de teste", reload }) as ReturnType<
        typeof useTimeline
      >,
    );

    render(<TimelineWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();
    expect(screen.getByText("Erro de teste")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("explains the active filters when the filtered result is empty", () => {
    render(<TimelineWidget />);

    expect(screen.getByText("Nada por aqui ainda")).toBeInTheDocument();
    expect(screen.getByText(FILTERED_EMPTY_DESCRIPTION)).toBeInTheDocument();
  });

  it("drops the filter guidance once the period covers every record", () => {
    render(<TimelineWidget />);

    pickSelectOption("Filtrar por período", "Todo o período");

    expect(screen.getByText("Nada por aqui ainda")).toBeInTheDocument();
    expect(screen.getByText(UNFILTERED_EMPTY_DESCRIPTION)).toBeInTheDocument();
  });

  it("renders the records returned by the timeline", () => {
    mockedUseTimeline.mockReturnValue(
      recordsMock({ records: [timelineEvent()] }) as ReturnType<
        typeof useTimeline
      >,
    );

    render(<TimelineWidget />);

    expect(screen.getByText("Senti-me bem hoje")).toBeInTheDocument();
  });

  it("exposes the period control and the type filter", () => {
    render(<TimelineWidget />);

    expect(
      screen.getByRole("combobox", { name: "Filtrar por período" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Filtrar por tipo" }),
    ).toBeInTheDocument();
  });

  it("exposes one type pill per event type, all active by default", () => {
    render(<TimelineWidget />);

    const pills = within(
      screen.getByRole("group", { name: "Filtrar por tipo" }),
    );

    for (const label of [
      "Glicemia",
      "Refeição",
      "Atividade física",
      "Observação",
      "Medicamento",
    ]) {
      expect(pills.getByRole("button", { name: label })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
  });

  it("applies the selected type over the current period range", () => {
    const applyFilters = vi.fn();
    mockedUseTimeline.mockReturnValue(
      recordsMock({ applyFilters }) as ReturnType<typeof useTimeline>,
    );

    render(<TimelineWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Refeição" }));

    expect(applyFilters).toHaveBeenCalledWith({
      ...WEEK_RANGE,
      types: ["meal"],
    });
  });

  it("clears the type filter once every pill is deselected", () => {
    const applyFilters = vi.fn();
    mockedUseTimeline.mockReturnValue(
      recordsMock({ applyFilters }) as ReturnType<typeof useTimeline>,
    );

    render(<TimelineWidget />);

    const pill = screen.getByRole("button", { name: "Refeição" });
    fireEvent.click(pill);
    fireEvent.click(pill);

    expect(applyFilters).toHaveBeenLastCalledWith({
      ...WEEK_RANGE,
      types: undefined,
    });
  });

  it("accumulates several selected types", () => {
    const applyFilters = vi.fn();
    mockedUseTimeline.mockReturnValue(
      recordsMock({ applyFilters }) as ReturnType<typeof useTimeline>,
    );

    render(<TimelineWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Refeição" }));
    fireEvent.click(screen.getByRole("button", { name: "Observação" }));

    expect(applyFilters).toHaveBeenLastCalledWith({
      ...WEEK_RANGE,
      types: ["meal", "note"],
    });
  });

  it("applies the picked period range while keeping the selected types", () => {
    const applyFilters = vi.fn();
    mockedUseTimeline.mockReturnValue(
      recordsMock({ applyFilters }) as ReturnType<typeof useTimeline>,
    );

    render(<TimelineWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Refeição" }));
    pickSelectOption("Filtrar por período", "Todo o período");

    expect(applyFilters).toHaveBeenLastCalledWith({
      ...ALL_RANGE,
      types: ["meal"],
    });
  });
});
