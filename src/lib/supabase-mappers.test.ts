import { describe, expect, it } from "vitest";
import {
  mapAvailabilityRow,
  mapPotentialMeetingRow,
  mapScheduleItemRow,
} from "./supabase-mappers";

describe("Supabase row mappers", () => {
  it("supports object-shaped one-to-one relations and preserves priority", () => {
    const meeting = mapPotentialMeetingRow({
      id: "meeting-1",
      organisation_id: "company-1",
      institution_name: "PEN Partner",
      category: "Partner",
      status: "contacted",
      potential_meeting_admin_details: { contact_name: "Private contact" },
      potential_meeting_decisions: { decision: "interested", priority_rating: 2 },
    });

    expect(meeting).toMatchObject({
      contactName: "Private contact",
      decision: "interested",
      priorityRating: 2,
    });
  });

  it("supports legacy array-shaped relations", () => {
    const meeting = mapPotentialMeetingRow({
      id: "meeting-1",
      organisation_id: "company-1",
      institution_name: "Investor",
      category: "Investor",
      status: "draft",
      potential_meeting_decisions: [{ decision: "pass", note: "Not now" }],
    });

    expect(meeting.decision).toBe("pass");
    expect(meeting.decisionNote).toBe("Not now");
  });

  it("drops malformed availability and tolerates absent nested collections", () => {
    expect(mapAvailabilityRow({ starts_at: "TBC", ends_at: "TBC" })).toBeUndefined();

    const item = mapScheduleItemRow({
      id: "item-1",
      title: "Business meeting availability",
      item_type: "business_meeting",
      visibility_scope: "cohort",
      attendance_rule: "optional",
      time_precision: "unknown",
      cost_type: "not_applicable",
      status: "draft",
      booking_status: "to_arrange",
      priority: "not_rated",
      starts_at: "TBC",
    });

    expect(item.startsAt).toBeUndefined();
    expect(item.organisationIds).toEqual([]);
    expect(item.responses).toEqual([]);
  });

  it("normalises legacy stringified null optional fields", () => {
    const item = mapScheduleItemRow({
      id: "item-legacy-null",
      title: "Imported programme event",
      item_type: "lvnc_core",
      visibility_scope: "cohort",
      attendance_rule: "compulsory",
      time_precision: "exact",
      starts_at: "2026-10-08T09:00:00Z",
      ends_at: "2026-10-08T10:00:00Z",
      event_url: "null",
      registration_deadline: "null",
      review_by: "undefined",
      cost_type: "not_applicable",
      status: "proposed",
      booking_status: "details_to_verify",
      priority: "not_rated",
    });

    expect(item.eventUrl).toBeUndefined();
    expect(item.registrationDeadline).toBeUndefined();
    expect(item.reviewBy).toBeUndefined();
  });
});
