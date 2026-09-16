export type Role = "startup_member" | "lvnc_admin";
export type ItemType =
  | "lvnc_core"
  | "third_party"
  | "business_meeting"
  | "company_work";
export type ItemStatus = "draft" | "proposed" | "confirmed" | "cancelled";
export type AttendanceRule = "compulsory" | "recommended" | "optional";
export type Decision =
  | "going"
  | "interested"
  | "pass"
  | "acknowledged"
  | "undecided";
export type BookingStatus =
  | "not_required"
  | "to_register"
  | "register_interest"
  | "approval_required"
  | "invite_required"
  | "to_arrange"
  | "verified"
  | "details_to_verify";
export type TimePrecision =
  | "exact"
  | "morning"
  | "afternoon"
  | "evening"
  | "all_day"
  | "unknown";

export interface Organisation {
  id: string;
  name: string;
  slug: string;
}
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organisationId?: string;
}
export interface Response {
  organisationId: string;
  decision: Decision;
  note?: string;
  updatedAt: string;
}
export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  itemType: ItemType;
  visibilityScope: "cohort" | "selected_organisations";
  organisationIds: string[];
  attendanceRule: AttendanceRule;
  startsAt?: string;
  endsAt?: string;
  timePrecision: TimePrecision;
  location?: string;
  eventUrl?: string;
  registrationDeadline?: string;
  costType: "free" | "paid" | "not_applicable" | "unknown";
  costNote?: string;
  status: ItemStatus;
  bookingStatus: BookingStatus;
  priority:
    | "must_pursue"
    | "strong_option"
    | "conditional"
    | "low_priority"
    | "not_rated";
  fit?: string;
  nextAction?: string;
  sourceNote?: string;
  conflictGroupId?: string;
  meetingCategory?: string;
  meetingStatus?: string;
  contactName?: string;
  meetingNote?: string;
  responses: Response[];
}
export interface AvailabilityBlock {
  id: string;
  organisationId: string;
  title: string;
  note?: string;
  startsAt: string;
  endsAt: string;
}
export type ViewMode = "week" | "day" | "month";
