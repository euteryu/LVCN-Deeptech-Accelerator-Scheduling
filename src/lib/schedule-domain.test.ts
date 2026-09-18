import { describe, expect, it } from "vitest";
import { meetingCategoryLabel, overlaps, validTimestamp } from "./schedule-domain";

describe("schedule domain", () => {
  it("normalises timestamps without allowing placeholders", () => {
    expect(validTimestamp("TBC")).toBeUndefined();
    expect(validTimestamp("2026-10-22T09:00:00Z")).toBe("2026-10-22T09:00:00.000Z");
  });

  it("detects overlaps but permits adjacent events", () => {
    expect(overlaps("2026-10-22T09:00:00Z", "2026-10-22T11:00:00Z", "2026-10-22T10:00:00Z", "2026-10-22T12:00:00Z")).toBe(true);
    expect(overlaps("2026-10-22T09:00:00Z", "2026-10-22T10:00:00Z", "2026-10-22T10:00:00Z", "2026-10-22T11:00:00Z")).toBe(false);
  });

  it("groups detailed meeting categories", () => {
    expect(meetingCategoryLabel("Venture capital fund")).toBe("Investor");
    expect(meetingCategoryLabel("NHS digital health partner")).toBe("Healthcare & NHS");
  });
});
