"use client";

import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PERIOD_LABELS, formatPeriodRangeLabel } from "@/lib/date";
import { useReportData } from "../hooks/use-report-data";
import { useReport } from "../hooks/use-report";
import { PeriodCard } from "../ui/period-card.ui";
import { CategoryCard } from "../ui/category-card.ui";
import { ReportPreview } from "../ui/report-preview.ui";
import { FileText, Loader2, Check } from "lucide-react";

export function ReportsWidget() {
  const {
    period,
    setPeriod,
    records,
    insights,
    analysisPeriod,
    isLoading,
    error,
    reload,
  } = useReportData();

  const {
    status,
    report,
    canShareFile,
    categories,
    toggleCategory,
    generate,
    exportReport,
    shareReport,
  } = useReport({ records, insights, analysisPeriod });

  const periodLabel =
    period.period === "custom" && period.custom
      ? `de ${formatPeriodRangeLabel(period.custom)}`
      : PERIOD_LABELS[period.period];

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
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-4">
          <PeriodCard value={period} onChange={setPeriod} />

          <CategoryCard selected={categories} onToggle={toggleCategory} />

          <Button
            onClick={() => {
              void generate();
            }}
            disabled={status === "generating" || categories.length === 0}
            className="h-12 w-full text-base"
          >
            {status === "generating" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : status === "generated" ? (
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

          {report && (
            <ReportPreview
              data={report}
              periodLabel={periodLabel}
              canShareFile={canShareFile}
              onExportPdf={() => {
                void exportReport("pdf");
              }}
              onExportCsv={() => {
                void exportReport("csv");
              }}
              onExportJson={() => {
                void exportReport("json");
              }}
              onShare={() => {
                void shareReport();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
