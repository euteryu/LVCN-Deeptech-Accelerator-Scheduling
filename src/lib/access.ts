import type { Profile, ScheduleItem } from "../types";

/**
 * Startup editing is limited to proposals created by that company. LVCN
 * records can be targeted to the same company without becoming participant-
 * editable, and partner observers never receive write controls.
 */
export function canManageCompanyProposal(
  profile: Profile,
  item: ScheduleItem,
): boolean {
  return Boolean(
    profile.role === "startup_member" &&
      profile.organisationId &&
      item.itemType === "third_party" &&
      item.status === "proposed" &&
      item.createdOrganisationId === profile.organisationId &&
      item.organisationIds.includes(profile.organisationId),
  );
}
