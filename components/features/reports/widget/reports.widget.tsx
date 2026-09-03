"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import {
  PERIOD_LABELS,
  formatPeriodRangeLabel,
  resolvePeriodSelectionRange,
  type PeriodSelection,
} from "@/lib/date";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import { downloadFile, shareFile } from "@/lib/data-ownership/share";
import {
  buildReportData,
  buildCsvRows,
  buildReportFile,
  insightStrings,
  type ReportCategory,
  type ReportData,
  type ReportFormat,
} from "@/lib/reports";
import { ReportPreview } from "../ui/report-preview.ui";
import { FileText, Loader2, Check, Calendar } from "lucide-react";

type ReportState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "generated"; data: ReportData; csvRows: string };

const ALL_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "glucose", label: "Glicemia" },
  { value: "meals", label: "Refeições" },
  { value: "activity", label: "Atividade física" },
  { value: "notes", label: "Observações" },
];

export function ReportsWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodSelection>({
    period: "week",
    custom: null,
  });
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>(
    ["glucose", "meals", "activity", "notes"],
  );
  const [report, setReport] = useState<ReportState>({ status: "idle" });

  const [range, setRange] = useState(() =>
    resolvePeriodSelectionRange(period),
  );

  useEffect(() => {
    const refresh = () => setRange(resolvePeriodSelectionRange(period));
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [period]);

  const glucose = useGlucose(userId, range);
  const meals = useMeals(userId, range);
  const activities = useActivities(userId, range);
  const notes = useNotes(userId, range);

  const glucoseFilters = glucose.applyFilters;
  const mealsFilters = meals.applyFilters;
  const activitiesFilters = activities.applyFilters;
  const notesFilters = notes.applyFilters;

  useEffect(() => {
    if (!userId) return;
    void glucoseFilters(range);
    void mealsFilters(range);
    void activitiesFilters(range);
    void notesFilters(range);
  }, [
    userId,
    range,
    glucoseFilters,
    mealsFilters,
    activitiesFilters,
    notesFilters,
  ]);

  const isLoading =
    glucose.isLoading || meals.isLoading || activities.isLoading || notes.isLoading;
  const error = glucose.error ?? meals.error ?? activities.error ?? notes.error;

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
      const data = buildReportData({
        records: {
          glucose: glucose.records,
          meals: meals.records,
          activities: activities.records,
          notes: notes.records,
        },
        period: analysisPeriod,
        categories: selectedCategories,
        insights,
      });
      const csvRows = buildCsvRows(
        {
          glucose: glucose.records,
          meals: meals.records,
          activities: activities.records,
          notes: notes.records,
        },
        selectedCategories,
      );
      setReport({ status: "generated", data, csvRows });
      toast.add({
        title: "Relatório gerado com sucesso.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Não foi possível gerar o relatório.",
        type: "error",
      });
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
  ]);

  const handleExport = useCallback(
    async (format: ReportFormat) => {
      if (report.status !== "generated") return;
      try {
        const file = await buildReportFile(format, report.data, report.csvRows);
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
    try {
      const file = await buildReportFile("pdf", report.data, report.csvRows);
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
        <ErrorState
          message={error}
          onRetry={() => {
            void glucose.reload();
            void meals.reload();
            void activities.reload();
            void notes.reload();
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Period Selection */}
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="size-4 text-primary" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <PeriodRangeFilter value={period} onChange={setPeriod} />
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {ALL_CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.value)}
                      onChange={() => toggleCategory(cat.value)}
                      className="size-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">{cat.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate */}
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

          {/* Report Preview */}
          {report.status === "generated" && (
            <ReportPreview
              data={report.data}
              periodLabel={periodLabel}
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
