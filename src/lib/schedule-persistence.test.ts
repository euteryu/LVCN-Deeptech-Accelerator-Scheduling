import { describe, expect, it } from "vitest";
import type { ScheduleItem } from "../types";
import { meetingTargetValues, scheduleItemValues } from "./schedule-persistence";

const item: ScheduleItem = {
  id: "event-1",
  title: "Partner event",
  itemType: "third_party",
  visibilityScope: "selected_organisations",
  organisationIds: ["company-a"],
  attendanceRule: "optional",
  timePrecision: "exact",
  costType: "free",
  status: "proposed",
  bookingStatus: "details_to_verify",
  priority: "not_rated",
  responses: [],
};

describe("schedule persistence mapping", () => {
  it("normalises optional values for PostgREST", () => {
    expect(scheduleItemValues(item)).toMatchObject({
      title: "Partner event",
      item_type: "third_party",
      description: null,
      starts_at: null,
      next_action: null,
    });
  });

  it("preserves per-company coordination metadata", () => {
    expect(meetingTargetValues({
      ...item,
      meetingTargets: [{
        organisationId: "company-a",
        outreachStatus: "Agreed",
        availabilityNote: "Friday morning",
      }],
    }, "company-a")).toEqual({
      schedule_item_id: "event-1",
      organisation_id: "company-a",
      meeting_outreach_status: "Agreed",
      availability_note: "Friday morning",
      coordination_note: null,
    });
  });
});
