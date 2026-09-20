import type {
  AvailabilityBlock,
  PotentialMeeting,
  ScheduleItem,
  StartupUpdate,
} from "../types";
import { firstRelated } from "./relation";
import {
  normaliseGenericBusinessMeetingTitle,
  validTimestamp,
} from "./schedule-domain";

type DatabaseRow = Record<string, any>;

// A few early imports stored SQL nulls as the literal text "null". Treat
// those legacy values as absent so optional HTML controls (notably type=url)
// do not block editing an otherwise valid schedule row.
const nullableText = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return !trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined"
    ? undefined
    : value;
};

export function mapPotentialMeetingRow(row: DatabaseRow): PotentialMeeting {
  const adminDetails = firstRelated<DatabaseRow>(row.potential_meeting_admin_details);
  const decision = firstRelated<DatabaseRow>(row.potential_meeting_decisions);

  return {
    id: row.id,
    organisationId: row.organisation_id,
    institutionName: row.institution_name,
    category: row.category,
    status: row.status,
    proposedStartsAt: validTimestamp(row.proposed_starts_at),
    proposedEndsAt: validTimestamp(row.proposed_ends_at),
    location: row.location ?? undefined,
    externalUrl: row.external_url ?? `https://www.google.com/search?q=${encodeURIComponent(row.institution_name)}`,
    startupVisibleNote: row.startup_visible_note ?? undefined,
    nextAction: row.next_action ?? undefined,
    contactName: adminDetails?.contact_name ?? undefined,
    contactEmail: adminDetails?.contact_email ?? undefined,
    internalNote: adminDetails?.internal_note ?? undefined,
    decision: decision?.decision ?? "undecided",
    decisionNote: decision?.note ?? undefined,
    priorityRating: decision?.priority_rating ?? undefined,
    adminReviewedAt: decision?.admin_reviewed_at ?? undefined,
  };
}

export function mapStartupUpdateRow(row: DatabaseRow): StartupUpdate {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    kind: row.kind,
    title: row.title,
    body: row.body ?? undefined,
    scheduleItemId: row.schedule_item_id ?? undefined,
    potentialMeetingId: row.potential_meeting_id ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export function mapScheduleItemRow(row: DatabaseRow): ScheduleItem {
  const organisations = row.schedule_item_organisations ?? [];
  const participationRows = row.schedule_item_participation ?? [];
  const participationDetails = participationRows.map((entry: DatabaseRow) => ({
    organisationId: entry.organisation_id,
    ...(entry.schedule_item_participation_admin_details?.[0] ?? {}),
  }));
  const responses = row.event_responses ?? [];

  return {
    id: row.id,
    createdBy: row.created_by ?? undefined,
    createdOrganisationId: row.created_organisation_id ?? undefined,
    title: normaliseGenericBusinessMeetingTitle(row.title),
    description: row.description ?? undefined,
    itemType: row.item_type,
    visibilityScope: row.visibility_scope,
    organisationIds: organisations.map((entry: DatabaseRow) => entry.organisation_id),
    attendanceRule: row.attendance_rule,
    startsAt: validTimestamp(row.starts_at),
    endsAt: validTimestamp(row.ends_at),
    timePrecision: row.time_precision,
    location: row.location ?? undefined,
    eventUrl: nullableText(row.event_url) ?? nullableText(row.meeting_link),
    registrationDeadline: nullableText(row.registration_deadline),
    reviewBy: nullableText(row.review_by),
    costType: row.cost_type,
    costNote: nullableText(row.cost_note),
    status: row.status,
    bookingStatus: row.booking_status,
    priority: row.priority,
    fit: nullableText(row.fit),
    nextAction: nullableText(row.next_action),
    sourceNote: nullableText(row.source_note),
    participationByOrganisation: Object.fromEntries(
      participationRows.map((entry: DatabaseRow) => [entry.organisation_id, entry.status]),
    ),
    participationDetailsByOrganisation: Object.fromEntries(
      participationDetails.map((entry: DatabaseRow) => [entry.organisationId, {
        attendees: entry.attendees ?? undefined,
        attendanceStartsOn: entry.attendance_starts_on ?? undefined,
        attendanceEndsOn: entry.attendance_ends_on ?? undefined,
        adminNote: entry.admin_note ?? undefined,
      }]),
    ),
    meetingCategory: nullableText(row.meeting_category),
    meetingStatus: nullableText(row.meeting_status),
    contactName: nullableText(row.contact_name),
    contactEmail: nullableText(row.contact_email),
    meetingNote: nullableText(row.meeting_note),
    meetingTargets: organisations.map((entry: DatabaseRow) => ({
      organisationId: entry.organisation_id,
      outreachStatus:
        entry.meeting_outreach_status === "Agreed" || entry.meeting_outreach_status === "Rejected"
          ? entry.meeting_outreach_status
          : "Contacted",
      availabilityNote: entry.availability_note ?? undefined,
      coordinationNote: entry.coordination_note ?? undefined,
    })),
    conflictGroupId: row.schedule_item_conflict_groups?.[0]?.conflict_group_id,
    responses: responses.map((response: DatabaseRow) => ({
      id: response.id,
      organisationId: response.organisation_id,
      decision: response.decision,
      note: response.note ?? undefined,
      updatedAt: response.updated_at,
      adminReviewedAt: response.admin_reviewed_at ?? undefined,
      attendancePlan: response.attendance_plan ?? "not_set",
      attendanceStartsAt: response.attendance_starts_at ?? undefined,
      attendanceEndsAt: response.attendance_ends_at ?? undefined,
      conversationStatus: response.conversation_status ?? "none",
      adminResponseStatus: response.admin_response_status ?? undefined,
      messages: (response.event_response_messages ?? [])
        .map((message: DatabaseRow) => ({
          id: message.id,
          body: message.body,
          authorRole: message.author_role,
          createdAt: message.created_at,
        }))
        .sort((a: DatabaseRow, b: DatabaseRow) => a.createdAt.localeCompare(b.createdAt)),
    })),
  };
}

export function mapAvailabilityRow(row: DatabaseRow): AvailabilityBlock | undefined {
  const startsAt = validTimestamp(row.starts_at);
  const endsAt = validTimestamp(row.ends_at);
  if (!startsAt || !endsAt) return undefined;

  return {
    id: row.id,
    organisationId: row.organisation_id,
    title: row.title,
    note: row.note ?? undefined,
    startsAt,
    endsAt,
    adminReviewedAt: row.admin_reviewed_at ?? undefined,
  };
}
