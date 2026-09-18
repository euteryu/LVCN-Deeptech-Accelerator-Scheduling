import type {
  EngagementAccessEvent,
  EngagementIdentity,
  EngagementInvite,
} from "../types";

export type EngagementUser = {
  email: string;
  fullName?: string;
  accessCount: number;
  activeDays: number;
  firstAccess?: string;
  lastAccess?: string;
  accesses7d: number;
  previous7d: number;
  status: "active" | "cooling" | "inactive" | "never";
};

export type EngagementCompany = {
  organisationId: string;
  organisationName: string;
  users: EngagementUser[];
  accessCount: number;
  activeUsers: number;
  returningUsers: number;
  lastAccess?: string;
  dailyAccesses: Array<{ date: string; count: number }>;
};

const dayKey = (value: string | Date) => new Date(value).toISOString().slice(0, 10);

export function buildEngagementSummary(
  events: EngagementAccessEvent[],
  identities: EngagementIdentity[],
  invites: EngagementInvite[],
  organisationNames: Record<string, string>,
  now = new Date(),
): EngagementCompany[] {
  const profileById = new Map(identities.map((identity) => [identity.id, identity]));
  const users = new Map<string, {
    email: string;
    fullName?: string;
    organisationId: string;
    events: EngagementAccessEvent[];
  }>();

  const ensureUser = (email: string, organisationId: string, fullName?: string) => {
    const key = `${organisationId}:${email.toLowerCase()}`;
    if (!users.has(key)) users.set(key, { email: email.toLowerCase(), fullName, organisationId, events: [] });
    else if (fullName && !users.get(key)?.fullName) users.get(key)!.fullName = fullName;
    return users.get(key)!;
  };

  invites
    .filter((invite) => invite.role !== "lvnc_admin" && invite.organisationId)
    .forEach((invite) => ensureUser(invite.email, invite.organisationId!, invite.fullName));

  for (const event of events) {
    const identity = profileById.get(event.actorId);
    if (!identity || identity.role === "lvnc_admin") continue;
    const organisationId = event.organisationId || identity.organisationId;
    if (!organisationId) continue;
    ensureUser(identity.email, organisationId, identity.fullName).events.push(event);
  }

  const start7d = new Date(now.getTime() - 7 * 86_400_000);
  const start14d = new Date(now.getTime() - 14 * 86_400_000);
  const dayKeys = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    return dayKey(date);
  });
  const companies = new Map<string, EngagementCompany>();

  for (const entry of users.values()) {
    const sortedEvents = [...entry.events].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    const firstAccess = sortedEvents[0]?.occurredAt;
    const lastAccess = sortedEvents.at(-1)?.occurredAt;
    const lastDate = lastAccess ? new Date(lastAccess) : undefined;
    const activeDays = new Set(sortedEvents.map((event) => dayKey(event.occurredAt))).size;
    const accesses7d = sortedEvents.filter((event) => new Date(event.occurredAt) >= start7d).length;
    const previous7d = sortedEvents.filter((event) => {
      const occurred = new Date(event.occurredAt);
      return occurred >= start14d && occurred < start7d;
    }).length;
    const ageDays = lastDate ? (now.getTime() - lastDate.getTime()) / 86_400_000 : Infinity;
    const status: EngagementUser["status"] = !lastDate
      ? "never"
      : ageDays <= 7
        ? "active"
        : ageDays <= 14
          ? "cooling"
          : "inactive";
    const user: EngagementUser = {
      email: entry.email,
      fullName: entry.fullName,
      accessCount: sortedEvents.length,
      activeDays,
      firstAccess,
      lastAccess,
      accesses7d,
      previous7d,
      status,
    };
    const company = companies.get(entry.organisationId) ?? {
      organisationId: entry.organisationId,
      organisationName: organisationNames[entry.organisationId] ?? "Unknown organisation",
      users: [],
      accessCount: 0,
      activeUsers: 0,
      returningUsers: 0,
      dailyAccesses: dayKeys.map((date) => ({ date, count: 0 })),
    };
    company.users.push(user);
    company.accessCount += user.accessCount;
    if (status === "active") company.activeUsers += 1;
    if (activeDays >= 2) company.returningUsers += 1;
    if (lastAccess && (!company.lastAccess || lastAccess > company.lastAccess)) company.lastAccess = lastAccess;
    for (const event of sortedEvents) {
      const day = company.dailyAccesses.find((candidate) => candidate.date === dayKey(event.occurredAt));
      if (day) day.count += 1;
    }
    companies.set(entry.organisationId, company);
  }

  return [...companies.values()]
    .map((company) => ({
      ...company,
      users: company.users.sort((left, right) => (right.lastAccess ?? "").localeCompare(left.lastAccess ?? "")),
    }))
    .sort((left, right) => (right.lastAccess ?? "").localeCompare(left.lastAccess ?? ""));
}
