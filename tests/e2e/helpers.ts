import { expect, type Page } from "@playwright/test";

/** Enter a display name through the NameBar and wait for it to take effect. */
export async function setDisplayName(page: Page, name: string) {
  await page.getByPlaceholder("Your name…").fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(`Playing as`)).toBeVisible();
}

/** The season <select> is the one offering an "All seasons" option. */
export function seasonSelect(page: Page) {
  return page
    .getByRole("combobox")
    .filter({ has: page.getByRole("option", { name: "All seasons" }) });
}
