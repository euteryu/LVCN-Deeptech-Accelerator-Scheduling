import { describe, expect, it } from "vitest";
import { buildEngagementSummary } from "./engagement";

describe("engagement summary", () => {
  it("groups repeated anonymous profiles by company and email", () => {
    const result = buildEngagementSummary(
      [
        { actorId: "profile-1", organisationId: "org-1", occurredAt: "2026-09-17T10:00:00Z" },
        { actorId: "profile-2", organisationId: "org-1", occurredAt: "2026-09-18T10:00:00Z" },
      ],
      [
        { id: "profile-1", email: "founder@example.com", role: "startup_member", organisationId: "org-1" },
        { id: "profile-2", email: "founder@example.com", role: "startup_member", organisationId: "org-1" },
      ],
      [{ email: "founder@example.com", role: "startup_member", organisationId: "org-1" }],
      { "org-1": "Example Ltd" },
      new Date("2026-09-18T12:00:00Z"),
    );

    expect(result).toHaveLength(1);
    expect(result[0].users).toHaveLength(1);
    expect(result[0].users[0]).toMatchObject({ accessCount: 2, activeDays: 2, status: "active" });
    expect(result[0].returningUsers).toBe(1);
  });

  it("includes invited users who have never opened the app", () => {
    const result = buildEngagementSummary(
      [],
      [],
      [{ email: "new@example.com", fullName: "New User", role: "startup_member", organisationId: "org-1" }],
      { "org-1": "Example Ltd" },
      new Date("2026-09-18T12:00:00Z"),
    );

    expect(result[0].users[0]).toMatchObject({ email: "new@example.com", accessCount: 0, status: "never" });
  });
});
