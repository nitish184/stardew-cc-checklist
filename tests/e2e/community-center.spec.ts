import { test, expect } from "@playwright/test";
import { stubBackend } from "./stub";
import { seasonSelect, setDisplayName } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubBackend(page);
  await page.goto("/");
});

test("app loads and the Community Center tab renders", async ({ page }) => {
  // Gate is disabled (empty passphrase) so the checklist renders directly.
  await expect(page.getByRole("heading", { name: "Stardew Co-op Tracker" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Community Center" })).toBeVisible();

  // Rooms (h2) and at least one bundle + item row.
  await expect(page.getByRole("heading", { name: "Crafts Room" })).toBeVisible();
  expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThan(1);
  await expect(page.locator(".bundle").first()).toBeVisible();
  await expect(page.locator(".item").first()).toBeVisible();

  // Progress bars present.
  await expect(page.locator(".progress").first()).toBeVisible();
});

test("tab switching between Community Center and Gifts", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Crafts Room" })).toBeVisible();

  await page.getByRole("button", { name: "Gifts", exact: true }).click();
  await expect(page.getByText(/Track who your group has gifted this week/)).toBeVisible();
  await expect(page.locator(".villager").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crafts Room" })).toHaveCount(0);

  await page.getByRole("button", { name: "Community Center" }).click();
  await expect(page.getByRole("heading", { name: "Crafts Room" })).toBeVisible();
});

test("progress bars show an X of Y style count", async ({ page }) => {
  // Overall + room bars use "complete/total bundles · N%".
  await expect(page.getByText(/\d+\/\d+ bundles/).first()).toBeVisible();
  // Each bundle header shows an "X of Y" item count.
  await expect(page.getByText(/^\d+ of \d+/).first()).toBeVisible();
});

test("search filter reduces the visible item rows", async ({ page }) => {
  const rows = page.locator(".item");
  const before = await rows.count();
  expect(before).toBeGreaterThan(5);

  await page.getByPlaceholder("Search items…").fill("Horseradish");
  await expect(rows).toHaveCount(1);
  await expect(page.getByText("Wild Horseradish")).toBeVisible();
  expect(await rows.count()).toBeLessThan(before);
});

test("season filter changes what is shown", async ({ page }) => {
  const rows = page.locator(".item");
  const all = await rows.count();

  await seasonSelect(page).selectOption("winter");
  await expect(rows).not.toHaveCount(all);
  expect(await rows.count()).toBeLessThan(all);
});

test("hide-completed toggle removes a checked item", async ({ page }) => {
  await setDisplayName(page, "Tester");

  const firstItem = page.locator(".item").first();
  const label = await firstItem.locator(".item__name").innerText();
  await firstItem.locator("input.item__check").check();
  await expect(firstItem.locator("input.item__check")).toBeChecked();

  await page.getByLabel("Hide completed").check();
  await expect(page.getByText(label, { exact: true })).toHaveCount(0);
});

test("item sprite opens an info popover and closes on leaving", async ({ page }) => {
  const trigger = page.getByRole("button", { name: /^How to get / }).first();
  await trigger.hover();

  const tip = page.getByRole("tooltip").first();
  await expect(tip).toBeVisible();
  await expect(tip.locator(".pop__how")).not.toBeEmpty();
  await expect(tip.locator(".tag").first()).toBeVisible();

  // Move the pointer off the sprite -> popover closes.
  await page.getByRole("heading", { name: "Stardew Co-op Tracker" }).hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
