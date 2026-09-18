import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15_000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

async function rest(path, options = {}) {
  return page.evaluate(
    async ({ baseUrl, anonKey, path, options }) => {
      const stored = Object.entries(localStorage).find(([key]) => key.endsWith("-auth-token"))?.[1];
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
      if (!response.ok) throw new Error(await response.text());
      const body = await response.text();
      return body ? JSON.parse(body) : null;
    },
    { baseUrl: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY, path, options },
  );
}

async function chooseTestCompany(testOrganisationId) {
  const select = page.locator("select").filter({ has: page.locator('option[value="all"]') }).first();
  await select.evaluate((node, value) => {
    if (![...node.options].some((option) => option.value === value)) {
      node.add(new Option("TEST_COMPANY", value));
    }
  }, testOrganisationId);
  await select.selectOption(testOrganisationId);
  await page.waitForTimeout(600);
}

const auditKey = Date.now();
const originalTitle = `[TEST AUDIT ${auditKey}] Admin persistence fixture`;
const editedTitle = `${originalTitle} - persistence audit`;
const copyTitle = `${originalTitle} (copy)`;
const temporaryOrganisationId = randomUUID();
const temporaryItemId = randomUUID();

try {
  await page.goto("https://lvcn-deeptech-accelerator-scheduling.pages.dev");
  await page.getByPlaceholder("you@company.com").fill("minseok@lvcn.co.uk");
  await page.getByRole("button", { name: "Open programme board" }).click();
  await page.getByRole("button", { name: "Open account menu" }).waitFor();

  const userId = await page.evaluate(() => {
    const stored = Object.entries(localStorage).find(([key]) => key.endsWith("-auth-token"))?.[1];
    const token = JSON.parse(stored).access_token;
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
  });
  await rest("/organisations", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ id: temporaryOrganisationId, name: `TEST_COMPANY_AUDIT_${auditKey}`, slug: `test-company-audit-${auditKey}` }),
  });
  await rest("/schedule_items", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: temporaryItemId,
      title: originalTitle,
      description: "Temporary production audit fixture; safe to delete.",
      item_type: "third_party",
      visibility_scope: "selected_organisations",
      attendance_rule: "optional",
      starts_at: "2026-10-22T09:00:00+01:00",
      ends_at: "2026-10-22T10:00:00+01:00",
      time_precision: "exact",
      location: "QA only",
      cost_type: "free",
      status: "proposed",
      booking_status: "details_to_verify",
      priority: "not_rated",
      created_by: userId,
    }),
  });
  await rest("/schedule_item_organisations", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ schedule_item_id: temporaryItemId, organisation_id: temporaryOrganisationId }),
  });

  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await chooseTestCompany(temporaryOrganisationId);
  await page.getByText(originalTitle, { exact: true }).click();
  await page.getByRole("button", { name: "Edit item" }).click();
  await page.locator('input[name="title"]').fill(editedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText(editedTitle, { exact: true }).first().waitFor();

  await page.reload();
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await chooseTestCompany(temporaryOrganisationId);
  await page.getByText(editedTitle, { exact: true }).click();
  await page.getByRole("button", { name: "Edit item" }).click();
  await page.locator('input[name="title"]').fill(originalTitle);
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText(originalTitle, { exact: true }).first().waitFor();

  await page.getByRole("button", { name: "Duplicate" }).click();
  await page.getByText("Draft copy created", { exact: true }).waitFor();
  const copies = await rest(`/schedule_items?title=eq.${encodeURIComponent(copyTitle)}&select=id,title`);
  assert.equal(copies.length, 1, "Duplicate did not persist exactly once");

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await page.getByText("Item permanently deleted", { exact: true }).waitFor();
  const remainingCopies = await rest(`/schedule_items?id=eq.${copies[0].id}&select=id`);
  assert.equal(remainingCopies.length, 0, "Duplicate cleanup did not persist");

  const restored = await rest(`/schedule_items?id=eq.${temporaryItemId}&title=eq.${encodeURIComponent(originalTitle)}&select=id,title`);
  assert.equal(restored.length, 1, "Original QA fixture was not restored");
  assert.deepEqual(errors, []);
  console.log("Live admin edit, persistence, duplicate, and delete checks passed");
} finally {
  await rest(`/organisations?id=eq.${temporaryOrganisationId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  const leakedFixtures = await rest("/organisations?slug=like.test-company-audit-*&select=id");
  assert.equal(leakedFixtures.length, 0, "Temporary audit organisations were not fully cleaned up");
  await browser.close();
}
