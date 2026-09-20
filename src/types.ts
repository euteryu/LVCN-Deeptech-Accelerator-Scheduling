export type Role = "startup_member" | "partner_observer" | "lvnc_admin";
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
export type AttendancePlan =
  | "not_set"
  | "full_event"
  | "morning"
  | "afternoon"
  | "evening"
  | "custom_time";
export type ConversationStatus =
  | "none"
  | "awaiting_admin"
  | "awaiting_startup"
  | "resolved";
export type AdminResponseStatus =
  | "approved"
  | "needs_details"
  | "not_possible"
  | "information";

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
  id?: string;
  organisationId: string;
  decision: Decision;
  note?: string;
  updatedAt: string;
  adminReviewedAt?: string;
  attendancePlan?: AttendancePlan;
  attendanceStartsAt?: string;
  attendanceEndsAt?: string;
  conversationStatus?: ConversationStatus;
  adminResponseStatus?: AdminResponseStatus;
  messages?: Array<{
    id: string;
    body: string;
    authorRole: Role;
    createdAt: string;
  }>;
}
export interface MeetingTarget {
  organisationId: string;
  outreachStatus: "Contacted" | "Agreed" | "Rejected";
  availabilityNote?: string;
  coordinationNote?: string;
}
export interface ScheduleItem {
  id: string;
  createdBy?: string;
  createdOrganisationId?: string;
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
  reviewBy?: string;
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
  participationByOrganisation?: Record<string, "expected" | "not_attending">;
  participationDetailsByOrganisation?: Record<string, {
    attendees?: string;
    attendanceStartsOn?: string;
    attendanceEndsOn?: string;
    adminNote?: string;
  }>;
  conflictGroupId?: string;
  meetingCategory?: string;
  meetingStatus?: string;
  contactName?: string;
  contactEmail?: string;
  meetingNote?: string;
  meetingTargets?: MeetingTarget[];
  responses: Response[];
}
export interface AvailabilityBlock {
  id: string;
  organisationId: string;
  title: string;
  note?: string;
  startsAt: string;
  endsAt: string;
  adminReviewedAt?: string;
}
export type PotentialMeetingStatus = "draft" | "contacted" | "agreed" | "rejected" | "paused";
export interface PotentialMeeting {
  id: string;
  organisationId: string;
  institutionName: string;
  category: string;
  status: PotentialMeetingStatus;
  proposedStartsAt?: string;
  proposedEndsAt?: string;
  location?: string;
  externalUrl?: string;
  startupVisibleNote?: string;
  nextAction?: string;
  contactName?: string;
  contactEmail?: string;
  internalNote?: string;
  decision: Decision;
  decisionNote?: string;
  priorityRating?: 1 | 2 | 3;
  adminReviewedAt?: string;
}
export type StartupUpdateKind = "schedule" | "potential_biz_meet" | "admin_message";
export interface StartupUpdate {
  id: string;
  organisationId: string;
  kind: StartupUpdateKind;
  title: string;
  body?: string;
  scheduleItemId?: string;
  potentialMeetingId?: string;
  createdAt: string;
  readAt?: string;
}
export type ViewMode = "week" | "day" | "month";

export interface EngagementAccessEvent {
  actorId: string;
  organisationId?: string;
  occurredAt: string;
}

export interface EngagementIdentity {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  organisationId?: string;
}

export interface EngagementInvite {
  email: string;
  fullName?: string;
  role: Role;
  organisationId?: string;
}
