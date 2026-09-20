import { addDays, format } from "date-fns";
import type { Decision, ItemType, ScheduleItem } from "../types";

export const pretty = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const bookingLabel = (value: string) =>
  value === "not_required" ? "Free attendance" : pretty(value);

export const dateLabel = (item: ScheduleItem) =>
  item.startsAt
    ? item.timePrecision === "all_day"
      ? `${format(new Date(item.startsAt), "EEE d MMM")} · All day`
      : format(new Date(item.startsAt), "EEE d MMM · HH:mm")
    : "Time to confirm";

export const overlaps = (startA: string, endA: string, startB?: string, endB?: string) =>
  Boolean(startB && endB && new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB));

export const validTimestamp = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export const safeDate = (value?: string | Date) => {
  const parsed = value instanceof Date ? value : new Date(value ?? "");
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const calendarState = (item: ScheduleItem, decision?: Decision) =>
  item.status === "confirmed" || ["going", "acknowledged"].includes(decision ?? "")
    ? "border-emerald-300 bg-emerald-50"
    : "border-dashed border-amber-300 bg-amber-50/50";

export const isNotAttending = (item: ScheduleItem, organisationId?: string) =>
  Boolean(organisationId && item.participationByOrganisation?.[organisationId] === "not_attending");

export const nextWorkingDay = (date: Date, direction: 1 | -1) => {
  let next = addDays(date, direction);
  while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, direction);
  return next;
};

export const meetingCategoryFor = (item: ScheduleItem) =>
  item.meetingCategory ?? item.description?.match(/^Category:\s*([^\n]+)/)?.[1] ?? "Business meeting";

const genericBusinessMeetingTitle = /^busines{1,2}\s+meetings?\b/i;
export const isGenericBusinessMeetingSlot = (item: ScheduleItem) => genericBusinessMeetingTitle.test(item.title.trim());
export const normaliseGenericBusinessMeetingTitle = (title: string) => title.replace(genericBusinessMeetingTitle, "Business Meetings");
export const spreadsheetTypeFor = (item: ScheduleItem): ItemType => item.itemType;

export const scheduleDecisionState = (item: ScheduleItem, organisationId?: string) => {
  const responses = organisationId ? item.responses.filter((response) => response.organisationId === organisationId) : item.responses;
  if (responses.some((response) => ["going", "acknowledged"].includes(response.decision))) return "confirmed";
  if (responses.length > 0 && responses.every((response) => response.decision === "pass")) return "rejected";
  return "pending";
};

export const isSupersededDeepFusionMeeting = (item: ScheduleItem) => item.title.trim().toLowerCase() === "md one";

export const meetingCategoryLabel = (category: string) => {
  const value = category.trim().toLowerCase();
  if (!value) return "Other";
  if (value.includes("invest") || value.includes("venture") || value.includes("capital") || value.includes("finance") || value.includes("funding") || value.includes("vc") || value.includes("founder investor")) return "Investor";
  if (value.includes("advertis") || value.includes("agency")) return "Advertising & agency partners";
  if (value.includes("creative") || value.includes("media") || value.includes("communications") || value.includes("pr /")) return "Creative & media ecosystem";
  if (value.includes("compliance") || value.includes("regulatory") || value.includes("regulation") || value.includes("certification") || value.includes("standards") || value.includes("data protection") || value.includes("notified body") || value.includes("quality")) return "Regulation & compliance";
  if (value.includes("clinical") || value.includes("research") || value.includes("academic") || value.includes("university") || value.includes("neuroscience") || value.includes("parkinson")) return "Research & clinical";
  if (value.includes("nhs") || value.includes("hospital") || value.includes("healthcare") || value.includes("healthtech") || value.includes("digital health") || value.includes("pharmacy") || value.includes("patient") || value.includes("life science") || value.includes("life-science") || value.includes("pharma")) return "Healthcare & NHS";
  if (value.includes("distribution") || value.includes("sales") || value.includes("market access") || value.includes("commercial") || value.includes("retail")) return "Sales & distribution";
  if (value.includes("manufactur") || value.includes("ems") || value.includes("electronics") || value.includes("aerospace") || value.includes("industrial") || value.includes("battery")) return "Manufacturing & industrial";
  if (value.includes("automation") || value.includes("robotics") || value.includes("systems integration")) return "Automation & robotics";
  if (value.includes("defence") || value.includes("security") || value.includes("mobility") || value.includes("automotive")) return "Defence & mobility";
  if (value.includes("corporate") || value.includes("strategic") || value.includes("enterprise") || value.includes("partner") || value.includes("innovation")) return "Strategic & corporate partners";
  if (value.includes("technology") || value.includes("digital") || value.includes("ecosystem") || value.includes("ai")) return "Technology ecosystem";
  if (value.includes("internal team")) return "Internal team";
  return "Other";
};
