import type { ScheduleItem } from "../types";

export const scheduleItemValues = (item: ScheduleItem) => ({
  title: item.title,
  description: item.description || null,
  item_type: item.itemType,
  visibility_scope: item.visibilityScope,
  attendance_rule: item.attendanceRule,
  starts_at: item.startsAt || null,
  ends_at: item.endsAt || null,
  time_precision: item.timePrecision,
  location: item.location || null,
  event_url: item.eventUrl || null,
  registration_deadline: item.registrationDeadline || null,
  review_by: item.reviewBy || null,
  cost_type: item.costType,
  cost_note: item.costNote || null,
  status: item.status,
  booking_status: item.bookingStatus,
  priority: item.priority,
  fit: item.fit || null,
  next_action: item.nextAction || null,
  source_note: item.sourceNote || null,
  meeting_category: item.meetingCategory || null,
  meeting_status: item.meetingStatus || null,
  contact_name: item.contactName || null,
  meeting_note: item.meetingNote || null,
});

export const meetingTargetValues = (item: ScheduleItem, organisationId: string) => {
  const target = item.meetingTargets?.find(
    (entry) => entry.organisationId === organisationId,
  );
  return {
    schedule_item_id: item.id,
    organisation_id: organisationId,
    meeting_outreach_status: target?.outreachStatus ?? "Contacted",
    availability_note: target?.availabilityNote || null,
    coordination_note: target?.coordinationNote || null,
  };
};
