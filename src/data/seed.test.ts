import { describe, expect, it } from "vitest";
import { organisations, profiles, seedAvailability, seedItems } from "./seed";

describe("representative programme data", () => {
  it("covers the operational item types and unknown timing", () => {
    expect(new Set(seedItems.map((item) => item.itemType))).toEqual(new Set(["lvnc_core", "third_party", "business_meeting", "company_work"]));
    expect(seedItems.some((item) => item.timePrecision === "unknown" && !item.startsAt)).toBe(true);
    expect(new Set(seedItems.filter((item) => item.conflictGroupId).map((item) => item.conflictGroupId)).size).toBeGreaterThan(0);
  });

  it("never targets an unknown organisation", () => {
    const ids = new Set(organisations.map((organisation) => organisation.id));
    seedItems.flatMap((item) => item.organisationIds).forEach((id) => expect(ids.has(id)).toBe(true));
    seedItems.flatMap((item) => item.responses).forEach((response) => expect(ids.has(response.organisationId)).toBe(true));
    seedAvailability.forEach((block) => expect(ids.has(block.organisationId)).toBe(true));
  });

  it("keeps startup demo members attached to exactly one organisation", () => {
    profiles.filter((profile) => profile.role === "startup_member").forEach((profile) => expect(profile.organisationId).toBeTruthy());
  });
});
