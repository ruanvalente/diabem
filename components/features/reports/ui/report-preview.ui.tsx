import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import type {
  ReportData,
  ReportFormat,
  ReportTimelineEntry,
} from "@/lib/reports";
import { formatDateLong, formatTime } from "@/lib/date";

type ReportPreviewProps = {
  data: ReportData;
  periodLabel: string;
  canShareFile: boolean;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onShare: () => void;
};

const EXPORT_FORMATS: { format: ReportFormat; label: string }[] = [
  { format: "pdf", label: "PDF" },
  { format: "csv", label: "CSV" },
  { format: "json", label: "JSON" },
];

const TYPE_COLORS: Record<string, string> = {
  glucose: "bg-primary/15 text-primary",
  meal: "bg-success/15 text-success",
  activity: "bg-warning/15 text-warning",
  note: "bg-destructive/15 text-destructive",
  medication: "bg-info/15 text-info",
};

const TIMELINE_LIMIT = 10;

type SummaryTileProps = {
  label: string;
  value: string;
};

function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

type TimelineRowProps = {
  entry: ReportTimelineEntry;
};

function TimelineRow({ entry }: TimelineRowProps) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={`mt-0.5 inline-block size-2 shrink-0 rounded-full ${TYPE_COLORS[entry.type] ?? "bg-muted"}`}
      />
      <span className="text-foreground/80">
        <span className="font-medium text-foreground">{entry.label}</span> ·{" "}
        {entry.detail} ·{" "}
        <span className="text-muted-foreground">
          {formatDateLong(entry.at)} · {formatTime(entry.at)}
        </span>
      </span>
    </li>
  );
}

export function ReportPreview({
  data,
  periodLabel,
  canShareFile,
  onExportPdf,
  onExportCsv,
  onExportJson,
  onShare,
}: ReportPreviewProps) {
  const { summary } = data;
  const timelineSlice = data.timeline.slice(0, TIMELINE_LIMIT);

  const summaryTiles: SummaryTileProps[] = [
    { label: "Glicemias", value: String(summary.glucoseCount) },
    {
      label: "Média",
      value:
        summary.glucoseAverage != null
          ? `${summary.glucoseAverage} mg/dL`
          : "—",
    },
    { label: "Refeições", value: String(summary.mealCount) },
    { label: "Atividades", value: String(summary.activityCount) },
    { label: "Medicamentos", value: String(summary.medicationCount) },
  ];

  const exportHandlers: Record<ReportFormat, () => void> = {
    pdf: onExportPdf,
    csv: onExportCsv,
    json: onExportJson,
  };

  return (
    <Card className="border-border shadow-(--shadow-card)">
      <CardHeader>
        <CardTitle className="text-base">Relatório — {periodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {summaryTiles.map((tile) => (
            <SummaryTile key={tile.label} {...tile} />
          ))}
        </div>

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

        {timelineSlice.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Linha do tempo
            </p>
            <ul className="space-y-1.5">
              {timelineSlice.map((entry, i) => (
                <TimelineRow key={`${entry.at}-${i}`} entry={entry} />
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          {EXPORT_FORMATS.map(({ format, label }) => (
            <Button
              key={format}
              variant="outline"
              className="flex-1 gap-2"
              onClick={exportHandlers[format]}
            >
              <Download className="size-4" />
              {label}
            </Button>
          ))}
          <Button variant="outline" className="flex-1 gap-2" onClick={onShare}>
            <Share2 className="size-4" />
            {canShareFile ? "Compartilhar" : "Baixar arquivo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
