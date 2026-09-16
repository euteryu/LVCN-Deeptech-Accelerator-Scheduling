import { format, isSameDay } from "date-fns";
import jsPDF from "jspdf";
import writeXlsxFile from "write-excel-file/browser";
import type { Organisation, ScheduleItem } from "../types";

const displayDate = (item: ScheduleItem) => item.startsAt ? format(new Date(item.startsAt), "EEE d MMM yyyy, HH:mm") : "Time to confirm";

export async function exportExcel(items: ScheduleItem[], organisations: Organisation[]) {
  const sorted = [...items].sort((a, b) => (a.startsAt ?? "z").localeCompare(b.startsAt ?? "z"));
  const data: any[][] = [[{ value: "LVCN | Schedule", fontWeight: "bold", fontSize: 16 }], [{ value: `Living decision sheet. Exported ${format(new Date(), "d MMMM yyyy, HH:mm")}. All times London time.`, fontStyle: "italic" }], [], ["Event / meeting", "Start", "End", "Type", "Decision", "Notes (costs; deadlines; next action)", "Location", "Audience"].map((value) => ({ value, fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#1E1B4B" }))];
  let previousDay: Date | undefined;
  for (const item of sorted) {
    const date = item.startsAt ? new Date(item.startsAt) : undefined;
    if (date && (!previousDay || !isSameDay(date, previousDay))) { data.push([{ value: format(date, "EEEE, d MMMM yyyy"), fontWeight: "bold", backgroundColor: "#E0E7FF" }]); previousDay = date; }
    data.push([item.title, date ? format(date, "HH:mm") : "", item.endsAt ? format(new Date(item.endsAt), "HH:mm") : "", item.itemType.replaceAll("_", " "), item.status, [item.costNote, item.nextAction].filter(Boolean).join("; "), item.location ?? "", item.visibilityScope === "cohort" ? "Whole cohort" : item.organisationIds.map((id) => organisations.find((o) => o.id === id)?.name ?? id).join(", ")].map((value) => ({ value, wrap: true, alignVertical: "top" })));
  }
  await writeXlsxFile(data, {
    columns: [42, 12, 12, 20, 14, 42, 34, 32].map((width) => ({ width })),
  }).toFile(`LVCN-programme-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}

export function exportPdf(items: ScheduleItem[]) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  let y = 60;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(20); pdf.text("LVCN programme schedule", 48, y);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(90); y += 20; pdf.text(`Exported ${format(new Date(), "d MMMM yyyy, HH:mm")}`, 48, y); y += 30;
  items.forEach((item) => {
    if (y > 760) { pdf.addPage(); y = 55; }
    pdf.setTextColor(15); pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.text(item.title, 48, y, { maxWidth: width - 96 }); y += 15;
    pdf.setTextColor(90); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(`${displayDate(item)}  •  ${item.location ?? "Location to confirm"}  •  ${item.status}`, 48, y, { maxWidth: width - 96 }); y += 22;
  });
  pdf.save(`LVCN-programme-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
