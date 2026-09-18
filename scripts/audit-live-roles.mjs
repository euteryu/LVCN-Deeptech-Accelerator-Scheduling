import { readFile } from "node:fs/promises";
import { chromium } from "../tmp/qa-browser/node_modules/playwright/index.mjs";

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const appUrl = "https://lvcn-deeptech-accelerator-scheduling.pages.dev";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15_000);

async function login(email) {
  await page.goto(appUrl);
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByRole("button", { name: "Open programme board" }).click();
  await page.getByRole("button", { name: "Open account menu" }).waitFor();
  await page.waitForTimeout(1_500);
}

async function rest(path, options = {}) {
  return page.evaluate(
    async ({ baseUrl, anonKey, path, options }) => {
      const stored = Object.entries(localStorage).find(([key]) =>
        key.endsWith("-auth-token"),
      )?.[1];
      if (!stored) throw new Error("No browser auth session");
      const token = JSON.parse(stored).access_token;
      const response = await fetch(`${baseUrl}/rest/v1${path}`, {
        ...options,
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });
      return {
        ok: response.ok,
        status: response.status,
        body: await response.text(),
      };
    },
    {
      baseUrl: env.VITE_SUPABASE_URL,
      anonKey: env.VITE_SUPABASE_ANON_KEY,
      path,
      options,
    },
  );
}

try {
  await login("minseok@lvcn.co.uk");
  const profiles = await rest(
    "/profiles?select=id,email,full_name,role,organisation_id&order=role,email",
  );
  const organisations = await rest("/organisations?select=id,name,slug");
  const profileRows = profiles.ok ? JSON.parse(profiles.body) : [];
  const organisationRows = organisations.ok ? JSON.parse(organisations.body) : [];
  const names = Object.fromEntries(organisationRows.map((row) => [row.id, row.name]));
  const roleCounts = Object.groupBy(profileRows, (row) => row.role);
  const identityCounts = Object.entries(
    Object.groupBy(profileRows, (row) => row.email),
  )
    .map(([email, rows]) => ({ email, sessions: rows.length }))
    .sort((left, right) => right.sessions - left.sessions);
  const partnerEmail = profileRows.find(
    (row) => row.role === "partner_observer",
  )?.email;
  console.log(
    JSON.stringify(
      {
        profilesStatus: profiles.status,
        roleCounts: Object.fromEntries(
          Object.entries(roleCounts).map(([role, rows]) => [role, rows.length]),
        ),
        repeatedIdentitySessions: identityCounts.filter((entry) => entry.sessions > 1),
        adminPage: (await page.getByRole("heading", { name: "Admin hub" }).count()) > 0,
      },
      null,
      2,
    ),
  );

  if (!partnerEmail) throw new Error("No partner observer profile found");
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await login(partnerEmail);
  const observerChecks = {};
  for (const [name, path] of Object.entries({
    schedule: "/schedule_items?select=id&limit=5",
    responses: "/event_responses?select=id&limit=5",
    availability: "/availability_blocks?select=id&limit=5",
    meetings: "/potential_meetings?select=id&limit=5",
    privateMeetingDetails: "/potential_meeting_admin_details?select=potential_meeting_id&limit=5",
    updates: "/startup_updates?select=id&limit=5",
  })) {
    const result = await rest(path);
    observerChecks[name] = {
      status: result.status,
      rows: result.ok ? JSON.parse(result.body).length : null,
    };
  }
  observerChecks.ui = {
    scheduleNavigation: await page.getByRole("button", { name: "Schedule", exact: true }).count(),
    meetingNavigation: await page.getByRole("button", { name: "Potential Biz Meets", exact: true }).count(),
    decisionNavigation: await page.getByRole("button", { name: "My decisions", exact: true }).count(),
    createButtons: await page.getByText(/Create programme item|Add company work|Add Potential Biz Meet/).count(),
  };
  console.log(JSON.stringify({ observerChecks }, null, 2));
} finally {
  await browser.close();
}
