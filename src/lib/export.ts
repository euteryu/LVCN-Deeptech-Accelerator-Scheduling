import { format, isSameDay } from "date-fns";
import jsPDF from "jspdf";
import writeXlsxFile from "write-excel-file/browser";
import type { Organisation, ScheduleItem } from "../types";

export type ExportMode = "calendar" | "spreadsheet";
export type ExportOptions = {
  mode: ExportMode;
  onProgress?: (progress: number) => void;
  isCancelled?: () => boolean;
};

export type WeeklyScheduleRow = {
  title: string;
  date: string;
  time: string;
  type: string;
  location: string;
  status: string;
  attendance: string;
  notes: string;
  greyed?: boolean;
};

export type WeeklyExportMeta = {
  startupName: string;
  weekLabel: string;
};

export async function exportWeeklyScheduleExcel(rows: WeeklyScheduleRow[], meta: WeeklyExportMeta) {
  const data: any[][] = [
    [cell(`LVCN | Weekly schedule snapshot — ${meta.startupName}`, { fontWeight: "bold", fontSize: 16, textColor: "#162C5B" })],
    [cell(`${meta.weekLabel} · exported ${format(new Date(), "d MMMM yyyy, HH:mm")} · declined/cancelled rows are retained for audit`, { fontStyle: "italic", textColor: "#5B6472" })],
    [],
    ["Event", "Date", "Time", "Type", "Location", "Record status", "Startup attendance", "Notes"].map(headerCell),
  ];
  rows.forEach((row) => {
    const style = row.greyed ? { backgroundColor: "#F1F5F9", textColor: "#64748B", fontStrike: true } : {};
    data.push([row.title, row.date, row.time, row.type, row.location, row.status, row.attendance, row.notes].map((value) => cell(value, style)));
  });
  await writeXlsxFile(data, { columns: [34, 19, 14, 20, 30, 18, 22, 50].map((width) => ({ width })) }).toFile(
    `LVCN-weekly-schedule-${meta.startupName.replace(/[^a-z0-9]+/gi, "-")}-${meta.weekLabel.replace(/[^0-9]+/g, "-")}.xlsx`,
  );
}

export function exportWeeklySchedulePdf(rows: WeeklyScheduleRow[], meta: WeeklyExportMeta) {
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 34;
  pdf.setFillColor(22, 44, 91); pdf.rect(0, 0, width, 76, "F");
  pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(19); pdf.text("LVCN weekly schedule snapshot", margin, 31);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text(`${meta.startupName} · ${meta.weekLabel}`, margin, 51);
  pdf.setTextColor(70); pdf.setFontSize(8); pdf.text("Grey/struck-through rows were scheduled but declined or cancelled and are retained for the audit trail.", margin, 92);
  const cols = [margin, 190, 275, 345, 430, 550, 650, 755];
  let y = 116;
  const headers = ["Event", "Date", "Time", "Type", "Location", "Status", "Attendance", "Notes"];
  pdf.setFillColor(220, 239, 228); pdf.rect(margin, y - 14, width - margin * 2, 22, "F");
  pdf.setTextColor(22, 44, 91); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); headers.forEach((h, i) => pdf.text(h, cols[i], y));
  y += 24;
  rows.forEach((row) => {
    if (y > height - 38) { pdf.addPage(); y = 44; }
    const values = [row.title, row.date, row.time, row.type, row.location, row.status, row.attendance, row.notes];
    if (row.greyed) { pdf.setTextColor(130); pdf.setDrawColor(190); } else pdf.setTextColor(35);
    pdf.setFont("helvetica", row.greyed ? "normal" : "normal"); pdf.setFontSize(8);
    values.forEach((value, i) => pdf.text(pdf.splitTextToSize(value || "—", (cols[i + 1] ?? width - margin) - cols[i] - 8).slice(0, 2), cols[i], y));
    if (row.greyed) pdf.line(margin, y + 2, width - margin, y + 2);
    pdf.setDrawColor(230); pdf.line(margin, y + 16, width - margin, y + 16); y += 28;
  });
  pdf.save(`LVCN-weekly-schedule-${meta.startupName.replace(/[^a-z0-9]+/gi, "-")}-${meta.weekLabel.replace(/[^0-9]+/g, "-")}.pdf`);
}

const cancelled = (options: ExportOptions) => {
  if (options.isCancelled?.()) throw new Error("Export cancelled");
};
const text = (value?: string | null) => value?.trim() || "—";
const label = (value?: string | null) =>
  text(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const bookingLabel = (item: ScheduleItem) =>
  item.bookingStatus === "not_required" ? "Free attendance" : label(item.bookingStatus);
const itemTypeLabel = (item: ScheduleItem) => label(item.itemType);
const statusLabel = (item: ScheduleItem) => label(item.status);
const priorityLabel = (item: ScheduleItem) => label(item.priority);
const audienceLabel = (item: ScheduleItem, organisations: Organisation[]) =>
  item.visibilityScope === "cohort"
    ? "Whole cohort"
    : item.organisationIds.map((id) => organisations.find((org) => org.id === id)?.name ?? id).join(", ") || "—";
const dateLabel = (item: ScheduleItem) => item.startsAt ? format(new Date(item.startsAt), "EEE d MMM yyyy") : "Time to confirm";
const timeLabel = (item: ScheduleItem) => item.startsAt
  ? `${format(new Date(item.startsAt), "HH:mm")}–${item.endsAt ? format(new Date(item.endsAt), "HH:mm") : ""}`
  : "—";
const locationLabel = (item: ScheduleItem) => text(item.location);
const cell = (value: string, extra: Record<string, unknown> = {}) => ({
  value, wrap: true, alignVertical: "top", ...extra,
});
const headerCell = (value: string) => cell(value, {
  fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#162C5B",
});

export async function exportExcel(items: ScheduleItem[], organisations: Organisation[], options: ExportOptions) {
  const sorted = [...items].sort((a, b) => (a.startsAt ?? "z").localeCompare(b.startsAt ?? "z"));
  const spreadsheet = options.mode === "spreadsheet";
  const columns = spreadsheet
    ? ["Event / Meeting", "Date", "Start–end", "Type", "Status", "Priority", "Booking", "Why it fits", "Next action", "Location", "Audience"]
    : ["Date", "Time", "Event / Meeting", "Type", "Status", "Location", "Why it fits", "Next action", "Booking / cost"];
  const data: any[][] = [
    [cell(spreadsheet ? "LVCN | Programme board" : "LVCN | Calendar export", { fontWeight: "bold", fontSize: 16, textColor: "#162C5B" })],
    [cell(`Exported ${format(new Date(), "d MMMM yyyy, HH:mm")} · London time · ${sorted.length} item${sorted.length === 1 ? "" : "s"}`, { fontStyle: "italic", textColor: "#5B6472" })],
    [],
    columns.map(headerCell),
  ];
  let previousDay: Date | undefined;
  sorted.forEach((item, index) => {
    cancelled(options);
    const date = item.startsAt ? new Date(item.startsAt) : undefined;
    if (spreadsheet && date && (!previousDay || !isSameDay(date, previousDay))) {
      data.push([cell(format(date, "EEEE, d MMMM yyyy"), { fontWeight: "bold", backgroundColor: "#DCEFE4", textColor: "#162C5B" })]);
      previousDay = date;
    }
    const values = spreadsheet
      ? [item.title, dateLabel(item), timeLabel(item), itemTypeLabel(item), statusLabel(item), priorityLabel(item), bookingLabel(item), text(item.fit), text(item.nextAction), locationLabel(item), audienceLabel(item, organisations)]
      : [dateLabel(item), timeLabel(item), item.title, itemTypeLabel(item), statusLabel(item), locationLabel(item), text(item.fit), text(item.nextAction), [bookingLabel(item), item.costNote].filter(Boolean).join(" · ") || "—"];
    data.push(values.map((value) => cell(value)));
    options.onProgress?.(10 + Math.round(((index + 1) / Math.max(sorted.length, 1)) * 75));
  });
  cancelled(options);
  options.onProgress?.(90);
  const widths = spreadsheet ? [34, 19, 13, 18, 14, 14, 20, 48, 42, 34, 30] : [19, 13, 38, 18, 14, 34, 48, 42, 34];
  await writeXlsxFile(data, { columns: widths.map((width) => ({ width })) }).toFile(
    `LVCN-${spreadsheet ? "schedule-spreadsheet" : "calendar"}-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
  options.onProgress?.(100);
}

const pdfText = (pdf: jsPDF, value: string, x: number, y: number, width: number, size = 9) => {
  pdf.setFontSize(size);
  return pdf.splitTextToSize(value, width) as string[];
};

export function exportPdf(items: ScheduleItem[], options: ExportOptions) {
  const spreadsheet = options.mode === "spreadsheet";
  const sorted = [...items].sort((a, b) => (a.startsAt ?? "z").localeCompare(b.startsAt ?? "z"));
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: spreadsheet ? "landscape" : "portrait" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 34;
  const contentWidth = width - margin * 2;
  let page = 1;
  let y = 0;
  const footer = () => {
    pdf.setDrawColor(220, 226, 235); pdf.line(margin, height - 28, width - margin, height - 28);
    pdf.setTextColor(100); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
    pdf.text("LVCN Programme Board · Use the app record for live updates", margin, height - 14);
    pdf.text(`Page ${page}`, width - margin - 30, height - 14);
  };
  const header = () => {
    pdf.setFillColor(22, 44, 91); pdf.rect(0, 0, width, 74, "F");
    pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(19);
    pdf.text(spreadsheet ? "LVCN programme board" : "LVCN calendar schedule", margin, 31);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
    pdf.text(`${sorted.length} item${sorted.length === 1 ? "" : "s"} · Exported ${format(new Date(), "d MMMM yyyy, HH:mm")} · London time`, margin, 51);
    y = 98;
  };
  header();
  sorted.forEach((item, index) => {
    cancelled(options);
    const titleLines = pdfText(pdf, item.title, margin + 14, y + 20, contentWidth - 28, 12);
    const context = `${dateLabel(item)} · ${timeLabel(item)} · ${locationLabel(item)}`;
    const contextLines = pdfText(pdf, context, margin + 14, y + 20 + titleLines.length * 15, contentWidth - 28, 9);
    const detail = `Status: ${statusLabel(item)}   Priority: ${priorityLabel(item)}   Booking: ${bookingLabel(item)}`;
    const detailLines = pdfText(pdf, detail, margin + 14, y + 20 + titleLines.length * 15 + contextLines.length * 12, contentWidth - 28, 8.5);
    const fitLines = pdfText(pdf, `Why it fits: ${text(item.fit)}`, margin + 14, y + 20 + titleLines.length * 15 + contextLines.length * 12 + detailLines.length * 11, contentWidth - 28, 9);
    const nextLines = pdfText(pdf, `Next action: ${text(item.nextAction)}`, margin + 14, y + 20 + titleLines.length * 15 + contextLines.length * 12 + detailLines.length * 11 + fitLines.length * 12, contentWidth - 28, 9);
    const cardHeight = 22 + titleLines.length * 15 + contextLines.length * 12 + detailLines.length * 11 + fitLines.length * 12 + nextLines.length * 12;
    if (y + cardHeight > height - 44) { footer(); pdf.addPage(); page += 1; header(); y = 98; }
    pdf.setFillColor(247, 249, 252); pdf.setDrawColor(224, 230, 238); pdf.roundedRect(margin, y, contentWidth, cardHeight, 6, 6, "FD");
    let lineY = y + 20;
    pdf.setTextColor(22, 44, 91); pdf.setFont("helvetica", "bold"); pdf.text(titleLines, margin + 14, lineY); lineY += titleLines.length * 15;
    pdf.setTextColor(75); pdf.setFont("helvetica", "normal"); pdf.text(contextLines, margin + 14, lineY); lineY += contextLines.length * 12;
    pdf.setTextColor(100); pdf.setFontSize(8.5); pdf.text(detailLines, margin + 14, lineY); lineY += detailLines.length * 11;
    pdf.setTextColor(55); pdf.setFontSize(9); pdf.text(fitLines, margin + 14, lineY); lineY += fitLines.length * 12; pdf.text(nextLines, margin + 14, lineY);
    y += cardHeight + 10;
    options.onProgress?.(10 + Math.round(((index + 1) / Math.max(sorted.length, 1)) * 85));
  });
  footer(); cancelled(options); pdf.save(`LVCN-${spreadsheet ? "schedule-spreadsheet" : "calendar"}-${format(new Date(), "yyyy-MM-dd")}.pdf`); options.onProgress?.(100);
}
