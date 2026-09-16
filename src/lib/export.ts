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

const cancelled = (options: ExportOptions) => {
  if (options.isCancelled?.()) throw new Error("Export cancelled");
};
const displayDate = (item: ScheduleItem) =>
  item.startsAt
    ? format(new Date(item.startsAt), "EEE d MMM yyyy, HH:mm")
    : "Time to confirm";
const bookingLabel = (item: ScheduleItem) =>
  item.bookingStatus === "not_required"
    ? "Free attendance"
    : item.bookingStatus
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function exportExcel(
  items: ScheduleItem[],
  organisations: Organisation[],
  options: ExportOptions,
) {
  const sorted = [...items].sort((a, b) =>
    (a.startsAt ?? "z").localeCompare(b.startsAt ?? "z"),
  );
  const spreadsheet = options.mode === "spreadsheet";
  const data: any[][] = [
    [
      {
        value: spreadsheet
          ? "LVCN | Schedule spreadsheet"
          : "LVCN | Calendar export",
        fontWeight: "bold",
        fontSize: 16,
      },
    ],
    [
      {
        value: `Exported ${format(new Date(), "d MMMM yyyy, HH:mm")}. All times London time.`,
        fontStyle: "italic",
      },
    ],
    [],
    (spreadsheet
      ? [
          "Event / Meeting",
          "Start",
          "End",
          "Type",
          "Booking",
          "Notes",
          "Location",
          "Audience",
        ]
      : [
          "Date",
          "Time",
          "Event / Meeting",
          "Type",
          "Booking",
          "Location",
          "Notes",
        ]
    ).map((value) => ({
      value,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: "#162C5B",
    })),
  ];
  let previousDay: Date | undefined;
  sorted.forEach((item, index) => {
    cancelled(options);
    const date = item.startsAt ? new Date(item.startsAt) : undefined;
    if (date && (!previousDay || !isSameDay(date, previousDay))) {
      if (spreadsheet)
        data.push([
          {
            value: format(date, "EEEE, d MMMM yyyy"),
            fontWeight: "bold",
            backgroundColor: "#DCEFE4",
          },
        ]);
      previousDay = date;
    }
    const values = spreadsheet
      ? [
          item.title,
          date ? format(date, "HH:mm") : "",
          item.endsAt ? format(new Date(item.endsAt), "HH:mm") : "",
          item.itemType.replaceAll("_", " "),
          bookingLabel(item),
          [item.costNote, item.nextAction].filter(Boolean).join("; "),
          item.location ?? "",
          item.visibilityScope === "cohort"
            ? "Whole cohort"
            : item.organisationIds
                .map(
                  (id) =>
                    organisations.find((organisation) => organisation.id === id)
                      ?.name ?? id,
                )
                .join(", "),
        ]
      : [
          date ? format(date, "EEE d MMM yyyy") : "Time to confirm",
          date
            ? `${format(date, "HH:mm")}–${item.endsAt ? format(new Date(item.endsAt), "HH:mm") : ""}`
            : "",
          item.title,
          item.itemType.replaceAll("_", " "),
          bookingLabel(item),
          item.location ?? "",
          [item.costNote, item.nextAction].filter(Boolean).join("; "),
        ];
    data.push(
      values.map((value) => ({ value, wrap: true, alignVertical: "top" })),
    );
    options.onProgress?.(
      10 + Math.round(((index + 1) / Math.max(sorted.length, 1)) * 75),
    );
  });
  cancelled(options);
  options.onProgress?.(90);
  await writeXlsxFile(data, {
    columns: (spreadsheet
      ? [42, 12, 12, 20, 18, 42, 34, 32]
      : [18, 14, 42, 20, 18, 34, 42]
    ).map((width) => ({ width })),
  }).toFile(
    `LVCN-${spreadsheet ? "schedule-spreadsheet" : "calendar"}-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
  options.onProgress?.(100);
}

export function exportPdf(items: ScheduleItem[], options: ExportOptions) {
  const spreadsheet = options.mode === "spreadsheet";
  const sorted = [...items].sort((a, b) =>
    (a.startsAt ?? "z").localeCompare(b.startsAt ?? "z"),
  );
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: spreadsheet ? "landscape" : "portrait",
  });
  const width = pdf.internal.pageSize.getWidth();
  let y = 60;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(
    spreadsheet ? "LVCN schedule spreadsheet" : "LVCN calendar schedule",
    48,
    y,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  y += 20;
  pdf.text(`Exported ${format(new Date(), "d MMMM yyyy, HH:mm")}`, 48, y);
  y += 30;
  let previousDay: Date | undefined;
  sorted.forEach((item, index) => {
    cancelled(options);
    if (y > (spreadsheet ? 545 : 760)) {
      pdf.addPage();
      y = 55;
    }
    const date = item.startsAt ? new Date(item.startsAt) : undefined;
    if (
      !spreadsheet &&
      date &&
      (!previousDay || !isSameDay(date, previousDay))
    ) {
      pdf.setFillColor(220, 239, 228);
      pdf.rect(42, y - 13, width - 84, 18, "F");
      pdf.setTextColor(15);
      pdf.setFont("helvetica", "bold");
      pdf.text(format(date, "EEEE, d MMMM yyyy"), 48, y);
      y += 22;
      previousDay = date;
    }
    pdf.setTextColor(15);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(item.title, 48, y, { maxWidth: width - 96 });
    y += 15;
    pdf.setTextColor(90);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `${displayDate(item)}  |  ${bookingLabel(item)}  |  ${item.location ?? "Location to confirm"}`,
      48,
      y,
      { maxWidth: width - 96 },
    );
    y += 14;
    const notes = [item.costNote, item.nextAction].filter(Boolean).join(" | ");
    if (notes) {
      pdf.text(notes, 48, y, { maxWidth: width - 96 });
      y += 14;
    }
    y += 8;
    options.onProgress?.(
      10 + Math.round(((index + 1) / Math.max(sorted.length, 1)) * 85),
    );
  });
  cancelled(options);
  pdf.save(
    `LVCN-${spreadsheet ? "schedule-spreadsheet" : "calendar"}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
  );
  options.onProgress?.(100);
}
