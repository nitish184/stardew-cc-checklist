import { test, expect } from "@playwright/test";
import { stubBackend } from "./stub";
import { setDisplayName } from "./helpers";

test("name picker enables the checkboxes", async ({ page }) => {
  await stubBackend(page);
  await page.goto("/");

  const firstCheck = page.locator("input.item__check").first();
  await expect(firstCheck).toBeDisabled();

  await setDisplayName(page, "Abigail");
  await expect(firstCheck).toBeEnabled();
});

test("ticking an item updates the UI and only hits the stub, never Supabase", async ({ page }) => {
  const stub = await stubBackend(page);
  await page.goto("/");
  await setDisplayName(page, "Sebastian");

  const check = page.locator("input.item__check").first();
  await check.check();

  // Optimistic UI update.
  await expect(check).toBeChecked();
  await expect(check.locator("xpath=ancestor::li")).toHaveClass(/item--checked/);

  // The toggle was captured by the /api/check stub...
  await expect
    .poll(() => stub.apiCalls.filter((c) => c.url.includes("/api/check") && c.method === "POST").length)
    .toBeGreaterThan(0);
  const call = stub.apiCalls.find((c) => c.url.includes("/api/check"));
  expect(call?.body ?? "").toContain("slotId");

  // ...and no real Supabase write ever left the browser.
  expect(stub.supabaseWrites()).toEqual([]);
});
