import { describe, expect, it } from "vitest";
import { canManageCompanyProposal } from "./access";
import type { Profile, ScheduleItem } from "../types";

const startup: Profile = {
  id: "startup-user",
  email: "founder@example.com",
  fullName: "Founder",
  role: "startup_member",
  organisationId: "company-a",
};

const proposal: ScheduleItem = {
  id: "proposal",
  createdOrganisationId: "company-a",
  title: "Company conference proposal",
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

describe("canManageCompanyProposal", () => {
  it("allows another session from the owning company", () => {
    expect(canManageCompanyProposal({ ...startup, id: "new-browser-session" }, proposal)).toBe(true);
  });

  it("does not expose controls for an LVCN-created targeted item", () => {
    expect(canManageCompanyProposal(startup, { ...proposal, createdOrganisationId: undefined })).toBe(false);
  });

  it("does not expose participant controls to partner observers", () => {
    expect(canManageCompanyProposal({ ...startup, role: "partner_observer" }, proposal)).toBe(false);
  });

  it("does not let another company manage the proposal", () => {
    expect(canManageCompanyProposal({ ...startup, organisationId: "company-b" }, proposal)).toBe(false);
  });
});
