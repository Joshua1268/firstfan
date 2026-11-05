import { expect, test } from "./fixtures";
import { logIn } from "./helpers";

// make e2e passes DEMO_PASSWORD from .env; the demo accounts come from make seed.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "";

test.beforeEach(({}, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
  test.skip(!DEMO_PASSWORD, "Set DEMO_PASSWORD in .env, then run make seed.");
});

test("the demo dev sees the adoption table and a test to validate", async ({ page }) => {
  await logIn(page, "demo-dev@firstfan.demo", DEMO_PASSWORD);
  await expect(page).toHaveURL(/\/dev$/);
  await page.getByRole("link", { name: /Compta Express \(démo\)/ }).click();

  await expect(page).toHaveURL(/\/dev\/projets\/\d+$/);
  const adoption = page.getByRole("region", { name: "Adoption" });
  await expect(adoption.getByText("Données de démo")).toBeVisible();
  const table = adoption.getByRole("table");
  for (const label of ["J1", "J7", "J30"]) {
    await expect(table.getByRole("columnheader", { name: label })).toBeVisible();
  }
  await expect(table.getByRole("row")).toHaveCount(4);
  await expect(adoption.getByText(/sur \d+ reviennent? à J1/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("link", { name: /Comptable/ }).click();
  await expect(page).toHaveURL(/\/dev\/campagnes\/\d+$/);
  await expect(page.getByText("1 test à valider.")).toBeVisible();
});
