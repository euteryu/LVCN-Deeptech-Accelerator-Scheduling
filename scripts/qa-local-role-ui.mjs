import assert from "node:assert/strict";
import { chromium } from "../tmp/qa-browser/node_modules/playwright/index.mjs";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto(process.env.APP_URL ?? "http://127.0.0.1:5173");
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("button", { name: /PEN Ventures Observer/ }).click();

  assert.equal(
    await page.getByRole("button", { name: "Potential Biz Meets", exact: true }).count(),
    1,
    "PEN should have a route to the startup-safe opportunity view",
  );
  assert.equal(
    await page.getByText(/Add company work|My decisions|Action Inbox/).count(),
    0,
    "PEN should not receive participant or LVCN action controls",
  );

  await page.getByRole("button", { name: "Potential Biz Meets", exact: true }).click();
  assert.equal(
    await page.getByText("Read-only partner view.", { exact: false }).count(),
    1,
  );
  assert.equal(await page.getByRole("button", { name: "Add Potential Biz Meet" }).count(), 0);
  assert.deepEqual(errors, []);
  console.log("Local partner-observer UI checks passed");
} finally {
  await browser.close();
}
