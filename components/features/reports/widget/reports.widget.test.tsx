// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/health/hooks/use-glucose", () => ({ useGlucose: vi.fn() }));
vi.mock("@/lib/health/hooks/use-meals", () => ({ useMeals: vi.fn() }));
vi.mock("@/lib/health/hooks/use-activities", () => ({ useActivities: vi.fn() }));
vi.mock("@/lib/health/hooks/use-notes", () => ({ useNotes: vi.fn() }));
vi.mock("@/lib/health/hooks/use-medications", () => ({
  useMedications: vi.fn(),
}));
vi.mock("@/lib/intelligence/use-intelligence", () => ({
  useIntelligence: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/lib/data-ownership/share", () => ({
  canShare: vi.fn(),
  downloadFile: vi.fn(),
  shareFile: vi.fn(),
}));

vi.mock("@/lib/reports", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/reports")>();
  return {
    ...actual,
    buildReportFile: vi.fn(),
  };
});

import { ReportsWidget } from "./reports.widget";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useMedications } from "@/lib/health/hooks/use-medications";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import { toast } from "@/components/ui/toast";
import { canShare, shareFile } from "@/lib/data-ownership/share";
import { buildReportFile } from "@/lib/reports";

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGlucose = vi.mocked(useGlucose);
const mockedUseMeals = vi.mocked(useMeals);
const mockedUseActivities = vi.mocked(useActivities);
const mockedUseNotes = vi.mocked(useNotes);
const mockedUseMedications = vi.mocked(useMedications);
const mockedUseIntelligence = vi.mocked(useIntelligence);
const addToast = vi.mocked(toast.add);
const mockedCanShare = vi.mocked(canShare);
const mockedShareFile = vi.mocked(shareFile);
const mockedBuildReportFile = vi.mocked(buildReportFile);

function entityMock(overrides: Record<string, unknown> = {}) {
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

/** Renders the widget, generates the report and waits for the preview actions. */
async function renderWithGeneratedReport() {
  render(<ReportsWidget />);
  fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
  await screen.findByRole("button", { name: "PDF" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: { id: "u1" },
  } as ReturnType<typeof useAuth>);
  mockedUseGlucose.mockReturnValue(
    entityMock() as ReturnType<typeof useGlucose>,
  );
  mockedUseMeals.mockReturnValue(entityMock() as ReturnType<typeof useMeals>);
  mockedUseActivities.mockReturnValue(
    entityMock() as ReturnType<typeof useActivities>,
  );
  mockedUseNotes.mockReturnValue(entityMock() as ReturnType<typeof useNotes>);
  mockedUseMedications.mockReturnValue(
    entityMock() as ReturnType<typeof useMedications>,
  );
  mockedUseIntelligence.mockReturnValue({
    result: null,
    isLoading: false,
    error: null,
    insights: [],
  } as ReturnType<typeof useIntelligence>);
  mockedShareFile.mockResolvedValue({ ok: true, method: "share" });
  mockedCanShare.mockReturnValue(true);
  mockedBuildReportFile.mockResolvedValue({
    fileName: "relatorio-diabem-20260917-0000.pdf",
    content: new Blob(),
    mimeType: "application/pdf",
  });
});

describe("ReportsWidget", () => {
  it("lists Medicamentos as a default selected category", () => {
    render(<ReportsWidget />);

    expect(
      screen.getByRole("checkbox", { name: "Medicamentos" }),
    ).toBeChecked();
  });

  it("does not show a toast when generating the report", async () => {
    render(<ReportsWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));

    await screen.findByRole("button", { name: "PDF" });

    expect(addToast).not.toHaveBeenCalled();
  });

  it("shows a success toast when exporting the report as PDF", async () => {
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "PDF" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório PDF baixado.",
        type: "success",
      }),
    );
  });

  it("shows a success toast when exporting the report as CSV", async () => {
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "CSV" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório CSV baixado.",
        type: "success",
      }),
    );
  });

  it("shows a success toast when exporting the report as JSON", async () => {
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório JSON baixado.",
        type: "success",
      }),
    );
  });

  it("shows a success toast when the report is shared", async () => {
    mockedShareFile.mockResolvedValue({ ok: true, method: "share" });
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório compartilhado.",
        type: "success",
      }),
    );
  });

  it("shows a success toast when sharing falls back to download", async () => {
    mockedShareFile.mockResolvedValue({ ok: true, method: "download" });
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório baixado.",
        type: "success",
      }),
    );
  });

  it("does not show a toast when the user cancels sharing", async () => {
    mockedShareFile.mockResolvedValue({ ok: false, cancelled: true });
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await vi.waitFor(() => expect(mockedShareFile).toHaveBeenCalledTimes(1));
    expect(addToast).not.toHaveBeenCalled();
  });

  it("shows an error toast when the export fails", async () => {
    await renderWithGeneratedReport();

    mockedBuildReportFile.mockRejectedValueOnce(new Error("export failed"));
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível exportar o relatório.",
        type: "error",
      }),
    );
  });

  it("shares the pre-built file without rebuilding it during the share gesture", async () => {
    await renderWithGeneratedReport();

    // The PDF is built once at generation time so that navigator.share() runs
    // synchronously inside the click gesture (preserving transient activation).
    expect(mockedBuildReportFile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório compartilhado.",
        type: "success",
      }),
    );

    expect(mockedShareFile).toHaveBeenCalledTimes(1);
    expect(mockedBuildReportFile).toHaveBeenCalledTimes(1);
  });

  it("reuses the pre-built file when exporting as PDF", async () => {
    await renderWithGeneratedReport();

    expect(mockedBuildReportFile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "PDF" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Relatório PDF baixado.",
        type: "success",
      }),
    );

    // PDF export must not rebuild the file that is already available.
    expect(mockedBuildReportFile).toHaveBeenCalledTimes(1);
  });

  it("still generates the report when the PDF pre-build fails", async () => {
    mockedBuildReportFile.mockRejectedValueOnce(new Error("pdf build failed"));
    render(<ReportsWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));

    // The preview renders even though the PDF could not be built.
    await screen.findByRole("button", { name: "PDF" });

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível compartilhar o relatório.",
        type: "error",
      }),
    );
    expect(mockedShareFile).not.toHaveBeenCalled();
  });

  it("labels the share action as download when the browser cannot share files", async () => {
    mockedCanShare.mockReturnValue(false);
    await renderWithGeneratedReport();

    expect(
      screen.getByRole("button", { name: "Baixar arquivo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Compartilhar" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error toast when sharing fails", async () => {
    mockedShareFile.mockRejectedValueOnce(new Error("share failed"));
    await renderWithGeneratedReport();

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await vi.waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Não foi possível compartilhar o relatório.",
        type: "error",
      }),
    );
  });
});