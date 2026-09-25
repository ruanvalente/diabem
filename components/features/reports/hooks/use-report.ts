"use client";

import { useCallback, useMemo, useState } from "react";
import {
  downloadFile,
  shareFile as shareFileWithSystem,
  canShare,
  type ShareableFile,
} from "@/lib/data-ownership/share";
import type { AnalysisPeriod } from "@/lib/intelligence/types/analytics.types";
import {
  buildCsvRows,
  buildReportData,
  buildReportFile,
  type ReportCategory,
  type ReportData,
  type ReportFormat,
  type ReportSourceRecords,
} from "@/lib/reports";
import { toast } from "@/components/ui/toast";

const DEFAULT_CATEGORIES: ReportCategory[] = [
  "glucose",
  "meals",
  "activity",
  "notes",
  "medications",
];

export type ReportStatus = "idle" | "generating" | "generated";

type ReportState =
  | { status: "idle" }
  | { status: "generating" }
  | {
      status: "generated";
      data: ReportData;
      csvRows: string;
      /**
       * PDF built during generation so that navigator.share() runs
       * synchronously inside the click gesture (preserving transient
       * activation). Null when the pre-build failed.
       */
      pdfFile: ShareableFile | null;
    };

export type UseReportInput = {
  records: ReportSourceRecords;
  insights: string[];
  analysisPeriod: AnalysisPeriod | null;
};

export type UseReportResult = {
  status: ReportStatus;
  /** Generated report data, or null until a generation succeeds. */
  report: ReportData | null;
  /** Whether the browser can share files (otherwise the action downloads). */
  canShareFile: boolean;
  categories: ReportCategory[];
  /** Toggles a category and invalidates any previously generated report. */
  toggleCategory: (category: ReportCategory) => void;
  generate: () => Promise<void>;
  exportReport: (format: ReportFormat) => Promise<void>;
  shareReport: () => Promise<void>;
};

/**
 * Owns the report lifecycle: which categories are included, the generation
 * state machine and the distribution of the generated file (download/share).
 */
export function useReport({
  records,
  insights,
  analysisPeriod,
}: UseReportInput): UseReportResult {
  const [categories, setCategories] = useState<ReportCategory[]>(
    DEFAULT_CATEGORIES,
  );
  const [state, setState] = useState<ReportState>({ status: "idle" });

  const canShareFile = useMemo(() => canShare(), []);

  const toggleCategory = useCallback((category: ReportCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
    setState({ status: "idle" });
  }, []);

  const generate = useCallback(async () => {
    if (!analysisPeriod || categories.length === 0) return;
    setState({ status: "generating" });

    try {
      const data = buildReportData({
        records,
        period: analysisPeriod,
        categories,
        insights,
      });
      const csvRows = buildCsvRows(records, categories);

      let pdfFile: ShareableFile | null = null;
      try {
        pdfFile = await buildReportFile("pdf", data, csvRows);
      } catch {
        pdfFile = null;
      }

      setState({ status: "generated", data, csvRows, pdfFile });
    } catch {
      setState({ status: "idle" });
    }
  }, [analysisPeriod, categories, insights, records]);

  const exportReport = useCallback(
    async (format: ReportFormat) => {
      if (state.status !== "generated") return;
      try {
        const file =
          format === "pdf" && state.pdfFile
            ? state.pdfFile
            : await buildReportFile(format, state.data, state.csvRows);
        downloadFile(file);
        toast.add({
          title: `Relatório ${format.toUpperCase()} baixado.`,
          type: "success",
        });
      } catch {
        toast.add({
          title: "Não foi possível exportar o relatório.",
          type: "error",
        });
      }
    },
    [state],
  );

  const shareReport = useCallback(async () => {
    if (state.status !== "generated") return;

    const file = state.pdfFile;
    if (!file) {
      toast.add({
        title: "Não foi possível compartilhar o relatório.",
        type: "error",
      });
      return;
    }

    try {
      const result = await shareFileWithSystem(file);
      if (result.ok) {
        toast.add({
          title:
            result.method === "share"
              ? "Relatório compartilhado."
              : "Relatório baixado.",
          type: "success",
        });
      }
    } catch {
      toast.add({
        title: "Não foi possível compartilhar o relatório.",
        type: "error",
      });
    }
  }, [state]);

  return {
    status: state.status,
    report: state.status === "generated" ? state.data : null,
    canShareFile,
    categories,
    toggleCategory,
    generate,
    exportReport,
    shareReport,
  };
}
