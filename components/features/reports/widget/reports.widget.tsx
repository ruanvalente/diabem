"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import {
  PERIOD_LABELS,
  formatPeriodRangeLabel,
  type PeriodSelection,
} from "@/lib/date";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useMedications } from "@/lib/health/hooks/use-medications";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import {
  canShare,
  downloadFile,
  shareFile,
  type ShareableFile,
} from "@/lib/data-ownership/share";
import {
  buildReportData,
  buildCsvRows,
  buildReportFile,
  insightStrings,
  type ReportCategory,
  type ReportData,
  type ReportFormat,
  type ReportSourceRecords,
} from "@/lib/reports";
import { usePeriodRange } from "../hooks/use-period-range";
import { PeriodCard } from "../ui/period-card.ui";
import { CategoryCard } from "../ui/category-card.ui";
import { ReportPreview } from "../ui/report-preview.ui";
import { FileText, Loader2, Check } from "lucide-react";

type ReportState =
  | { status: "idle" }
  | { status: "generating" }
  | {
      status: "generated";
      data: ReportData;
      csvRows: string;
      shareFile: ShareableFile | null;
    };

export function ReportsWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodSelection>({
    period: "week",
    custom: null,
  });
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>(
    ["glucose", "meals", "activity", "notes", "medications"],
  );
  const [report, setReport] = useState<ReportState>({ status: "idle" });

  const canShareFile = useMemo(() => canShare(), []);

  const range = usePeriodRange(period);

  const glucose = useGlucose(userId, range);
  const meals = useMeals(userId, range);
  const activities = useActivities(userId, range);
  const notes = useNotes(userId, range);
  const medications = useMedications(userId, range);

  const glucoseFilters = glucose.applyFilters;
  const mealsFilters = meals.applyFilters;
  const activitiesFilters = activities.applyFilters;
  const notesFilters = notes.applyFilters;
  const medicationsFilters = medications.applyFilters;

  useEffect(() => {
    if (!userId) return;
    void glucoseFilters(range);
    void mealsFilters(range);
    void activitiesFilters(range);
    void notesFilters(range);
    void medicationsFilters(range);
  }, [
    userId,
    range,
    glucoseFilters,
    mealsFilters,
    activitiesFilters,
    notesFilters,
    medicationsFilters,
  ]);

  const isLoading =
    glucose.isLoading ||
    meals.isLoading ||
    activities.isLoading ||
    notes.isLoading ||
    medications.isLoading;
  const error =
    glucose.error ??
    meals.error ??
    activities.error ??
    notes.error ??
    medications.error;

  const analysisPeriod = useMemo(() => {
    if (!range.from || !range.to) return null;
    return { start: range.from, end: range.to };
  }, [range]);

  const intelligence = useIntelligence({
    glucose: glucose.records,
    meals: meals.records,
    activities: activities.records,
    notes: notes.records,
    period: analysisPeriod,
    enabled: !!analysisPeriod && !isLoading,
  });

  const periodLabel =
    period.period === "custom" && period.custom
      ? `de ${formatPeriodRangeLabel(period.custom)}`
      : PERIOD_LABELS[period.period];

  const toggleCategory = useCallback(
    (cat: ReportCategory) => {
      setSelectedCategories((prev) =>
        prev.includes(cat)
          ? prev.filter((c) => c !== cat)
          : [...prev, cat],
      );
      setReport({ status: "idle" });
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (!analysisPeriod || selectedCategories.length === 0) return;
    setReport({ status: "generating" });

    try {
      const insights = insightStrings(intelligence.insights);
      const sourceRecords: ReportSourceRecords = {
        glucose: glucose.records,
        meals: meals.records,
        activities: activities.records,
        notes: notes.records,
        medications: medications.records,
      };
      const data = buildReportData({
        records: sourceRecords,
        period: analysisPeriod,
        categories: selectedCategories,
        insights,
      });
      const csvRows = buildCsvRows(sourceRecords, selectedCategories);
      let reportFile: ShareableFile | null = null;
      try {
        reportFile = await buildReportFile("pdf", data, csvRows);
      } catch {
        reportFile = null;
      }

      setReport({ status: "generated", data, csvRows, shareFile: reportFile });
    } catch {
      setReport({ status: "idle" });
    }
  }, [
    analysisPeriod,
    selectedCategories,
    intelligence.insights,
    glucose.records,
    meals.records,
    activities.records,
    notes.records,
    medications.records,
  ]);

  const handleExport = useCallback(
    async (format: ReportFormat) => {
      if (report.status !== "generated") return;
      try {
        const file =
          format === "pdf" && report.shareFile
            ? report.shareFile
            : await buildReportFile(format, report.data, report.csvRows);
        downloadFile(file);
        toast.add({ title: `Relatório ${format.toUpperCase()} baixado.`, type: "success" });
      } catch {
        toast.add({ title: "Não foi possível exportar o relatório.", type: "error" });
      }
    },
    [report],
  );

  const handleShare = useCallback(async () => {
    if (report.status !== "generated") return;

    const file = report.shareFile;
    if (!file) {
      toast.add({
        title: "Não foi possível compartilhar o relatório.",
        type: "error",
      });
      return;
    }

    try {
      const result = await shareFile(file);
      if (result.ok) {
        toast.add({
          title: result.method === "share" ? "Relatório compartilhado." : "Relatório baixado.",
          type: "success",
        });
      } else if (result.cancelled) {
        return;
      }
    } catch {
      toast.add({ title: "Não foi possível compartilhar o relatório.", type: "error" });
    }
  }, [report]);

  const handleRetry = () => {
    void glucose.reload();
    void meals.reload();
    void activities.reload();
    void notes.reload();
    void medications.reload();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">
          Gere relatórios dos seus dados de saúde
        </p>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : (
        <div className="space-y-4">
          <PeriodCard value={period} onChange={setPeriod} />

          <CategoryCard
            selected={selectedCategories}
            onToggle={toggleCategory}
          />

          <Button
            onClick={() => { void handleGenerate(); }}
            disabled={report.status === "generating" || selectedCategories.length === 0}
            className="h-12 w-full text-base"
          >
            {report.status === "generating" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : report.status === "generated" ? (
              <>
                <Check className="size-4" />
                Relatório gerado
              </>
            ) : (
              <>
                <FileText className="size-4" />
                Gerar relatório
              </>
            )}
          </Button>

          {report.status === "generated" && (
            <ReportPreview
              data={report.data}
              periodLabel={periodLabel}
              canShareFile={canShareFile}
              onExportPdf={() => { void handleExport("pdf"); }}
              onExportCsv={() => { void handleExport("csv"); }}
              onExportJson={() => { void handleExport("json"); }}
              onShare={handleShare}
            />
          )}
        </div>
      )}
    </div>
  );
}
