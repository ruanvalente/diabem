import type { ShareableFile } from "@/lib/data-ownership/share";
import {
  CATEGORY_LABEL,
  fileTimestamp,
  serializeReportJson,
} from "./report-builder";
import type {
  ReportData,
  ReportFormat,
  ReportTimelineEntry,
} from "./report.types";
import { formatDateLong, formatTime } from "@/lib/date";

const PDF_MIME = "application/pdf";
const CSV_MIME = "text/csv;charset=utf-8";
const JSON_MIME = "application/json";

function slugFileName(base: string, timestamp: string, ext: string): string {
  return `${base}-${timestamp}.${ext}`;
}

/** Builds the printable text for a timeline entry. */
function timelineLine(entry: ReportTimelineEntry): string {
  return `${formatDateLong(entry.at)} · ${formatTime(entry.at)} · ${
    entry.label
  } — ${entry.detail}`;
}

async function buildPdf(data: ReportData): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Saúde", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Diabem · gerado em ${formatDateLong(data.generatedAt)}`, margin, y);
  doc.setTextColor(0);
  y += 7;
  doc.text(
    `Período: de ${formatDateLong(data.period.start)} a ${formatDateLong(
      data.period.end,
    )}`,
    margin,
    y,
  );
  const categoryText = data.categories
    .map((c) => CATEGORY_LABEL[c])
    .join(", ");
  y += 6;
  doc.text(`Categorias: ${categoryText}`, margin, y);
  y += 12;

  // Summary
  const s = data.summary;
  const summaryLines = [
    `Glicemias: ${s.glucoseCount}`,
    s.glucoseAverage != null ? `Média: ${s.glucoseAverage} mg/dL` : null,
    s.glucoseMinimum != null ? `Mínima: ${s.glucoseMinimum} mg/dL` : null,
    s.glucoseMaximum != null ? `Máxima: ${s.glucoseMaximum} mg/dL` : null,
    `Refeições: ${s.mealCount}`,
    `Atividades: ${s.activityCount} (${s.activityTotalMinutes} min)`,
    `Observações: ${s.noteCount}`,
    `Total de registros: ${s.totalRecords}`,
  ].filter((line): line is string => line != null);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo", margin, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  for (const line of summaryLines) {
    ensureSpace(6);
    doc.text(line, margin, y);
    y += 6;
  }
  y += 6;

  // Insights
  if (data.insights.length > 0) {
    ensureSpace(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    for (const insight of data.insights) {
      const wrapped = doc.splitTextToSize(insight, maxWidth);
      ensureSpace(wrapped.length * 5 + 4);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 4;
    }
    y += 6;
  }

  // Timeline
  if (data.timeline.length > 0) {
    ensureSpace(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Linha do tempo", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    for (const entry of data.timeline) {
      const line = timelineLine(entry);
      const wrapped = doc.splitTextToSize(line, maxWidth);
      ensureSpace(wrapped.length * 5 + 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 2;
    }
  }

  return doc.output("blob");
}

/**
 * Generates a downloadable/shareable report file for the given format.
 * PDF is produced client-side (dynamically imported), offline and dependency-light.
 */
export async function buildReportFile(
  format: ReportFormat,
  data: ReportData,
  csvRows: string,
): Promise<ShareableFile> {
  const timestamp = fileTimestamp(new Date(data.generatedAt));

  if (format === "pdf") {
    const blob = await buildPdf(data);
    return {
      fileName: slugFileName("relatorio-diabem", timestamp, "pdf"),
      content: blob,
      mimeType: PDF_MIME,
    };
  }

  if (format === "csv") {
    return {
      fileName: slugFileName("relatorio-diabem", timestamp, "csv"),
      content: csvRows,
      mimeType: CSV_MIME,
    };
  }

  return {
    fileName: slugFileName("relatorio-diabem", timestamp, "json"),
    content: serializeReportJson(data),
    mimeType: JSON_MIME,
  };
}
