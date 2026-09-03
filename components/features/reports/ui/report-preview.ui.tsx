import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import type { ReportData } from "@/lib/reports";
import { formatDateLong, formatTime } from "@/lib/date";

type ReportPreviewProps = {
  data: ReportData;
  periodLabel: string;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onShare: () => void;
};

const TYPE_COLORS: Record<string, string> = {
  glucose: "bg-primary/15 text-primary",
  meal: "bg-success/15 text-success",
  activity: "bg-warning/15 text-warning",
  note: "bg-destructive/15 text-destructive",
};

export function ReportPreview({
  data,
  periodLabel,
  onExportPdf,
  onExportCsv,
  onExportJson,
  onShare,
}: ReportPreviewProps) {
  const s = data.summary;
  const timelineSlice = data.timeline.slice(0, 10);

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">
          Relatório — {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Glicemias</p>
            <p className="text-lg font-bold text-foreground">
              {s.glucoseCount}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="text-lg font-bold text-foreground">
              {s.glucoseAverage != null ? `${s.glucoseAverage} mg/dL` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Refeições</p>
            <p className="text-lg font-bold text-foreground">{s.mealCount}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Atividades</p>
            <p className="text-lg font-bold text-foreground">
              {s.activityCount}
            </p>
          </div>
        </div>

        {/* Insights */}
        {data.insights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Observações
            </p>
            <ul className="space-y-1.5">
              {data.insights.map((insight, i) => (
                <li
                  key={i}
                  className="text-sm text-foreground/80 before:mr-2 before:text-muted-foreground before:content-['•']"
                >
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timeline */}
        {timelineSlice.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Linha do tempo
            </p>
            <ul className="space-y-1.5">
              {timelineSlice.map((entry, i) => (
                <li
                  key={`${entry.at}-${i}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <span
                    className={`mt-0.5 inline-block size-2 shrink-0 rounded-full ${TYPE_COLORS[entry.type] ?? "bg-muted"}`}
                  />
                  <span className="text-foreground/80">
                    <span className="font-medium text-foreground">
                      {entry.label}
                    </span>{" "}
                    · {entry.detail} ·{" "}
                    <span className="text-muted-foreground">
                      {formatDateLong(entry.at)} · {formatTime(entry.at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={onExportPdf}>
            <Download className="size-4" />
            PDF
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={onExportCsv}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={onExportJson}>
            <Download className="size-4" />
            JSON
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={onShare}>
            <Share2 className="size-4" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
