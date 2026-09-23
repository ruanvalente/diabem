// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Droplets } from "lucide-react";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/use-dashboard-data", () => ({
  useDashboardData: vi.fn(),
}));

import { DashboardWidget } from "./dashboard.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useDashboardData } from "../hooks/use-dashboard-data";
import type { DataQuality } from "@/lib/intelligence/types/analytics.types";
import type { Insight } from "@/lib/intelligence/types/insight.types";
import type { RecentRecord, SummaryCard } from "../types";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseDashboardData = vi.mocked(useDashboardData);

const INSIGHT: Insight = {
  id: "ins-trend-0",
  type: "observation",
  priority: "medium",
  title: "Tendência identificada",
  description: "Foi identificada uma tendência nos seus registros.",
  evidence: [
    {
      metric: "glucose_count",
      value: 5,
      period: {
        start: "2026-09-01T00:00:00.000Z",
        end: "2026-09-07T00:00:00.000Z",
      },
    },
  ],
  ruleId: "trend-detected",
  ruleVersion: "1.0.0",
  explanation:
    "O número de medições no período foi suficiente para identificar uma tendência.",
  sourceIds: ["g1", "g2", "g3", "g4", "g5"],
  generatedAt: "2026-09-07T12:00:00.000Z",
};

const QUALITY: DataQuality = {
  totalRecords: 10,
  missingValues: 1,
  duplicatedRecords: 0,
  periodCoverage: 0.8,
  sufficientForAnalysis: true,
  score: 0.7,
  level: "medium",
  issues: [],
};

const SUMMARY_CARD: SummaryCard = {
  href: "/glucose",
  icon: Droplets,
  title: "Glicemias",
  count: 1,
  last: "100 mg/dL às 10:00",
  color: "text-primary",
  bg: "bg-primary/10",
};

const RECENT_RECORD: RecentRecord = {
  id: "g1",
  type: "glucose",
  href: "/glucose",
  icon: Droplets,
  title: "Glicemia",
  detail: "100 mg/dL · Jejum",
  at: "2026-09-01T10:00:00.000Z",
  time: "10:00",
};

function dashboardResult(
  overrides: Partial<ReturnType<typeof useDashboardData>> = {},
) {
  return {
    selection: { period: "today" as const, custom: null },
    setSelection: vi.fn(),
    subtitle: "Veja como foi seu acompanhamento hoje.",
    adverbial: "hoje",
    isLoading: false,
    error: null,
    reload: vi.fn(),
    lastGlucose: undefined,
    lastReadingInfo: null,
    glucoseCount: 0,
    summaryCards: [],
    charts: { cards: [], hasData: false },
    recentRecords: [],
    dataQuality: undefined,
    insights: [],
    ...overrides,
  } as ReturnType<typeof useDashboardData>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: { id: "u1", name: "Ana" },
  } as ReturnType<typeof useAuth>);
  mockedUseDashboardData.mockReturnValue(dashboardResult());
});

describe("DashboardWidget", () => {
  it("shows the loading skeleton while records are loading", () => {
    mockedUseDashboardData.mockReturnValue(dashboardResult({ isLoading: true }));

    render(<DashboardWidget />);

    expect(
      screen.getByRole("status", { name: "Carregando registros" }),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", () => {
    const reload = vi.fn();
    mockedUseDashboardData.mockReturnValue(
      dashboardResult({ error: "Erro de teste", reload }),
    );

    render(<DashboardWidget />);

    expect(
      screen.getByText("Não foi possível carregar seus registros."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("renders the quick actions and the period sections with data", () => {
    mockedUseDashboardData.mockReturnValue(
      dashboardResult({
        summaryCards: [SUMMARY_CARD],
        recentRecords: [RECENT_RECORD],
        insights: [INSIGHT],
        dataQuality: QUALITY,
      }),
    );

    render(<DashboardWidget />);

    expect(
      screen.getByRole("heading", { name: "Ações rápidas" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Glicemia" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resumo do período" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Padrões observados" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Registrados recentemente" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Qualidade dos dados")).toBeInTheDocument();
  });

  it("shows the empty charts state and hides data sections when empty", () => {
    render(<DashboardWidget />);

    expect(
      screen.getByRole("link", { name: "Registrar primeira glicemia" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resumo do período")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Padrões observados" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Registrados recentemente" }),
    ).not.toBeInTheDocument();
  });
});