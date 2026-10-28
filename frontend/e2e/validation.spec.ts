import { expect, test } from "./fixtures";
import { logIn, playSeededTest, seedOpenCampaign, uniqueEmail } from "./helpers";
import type { Page } from "@playwright/test";

test.beforeEach(({}, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
});

// The board asks the API again every 5 seconds: a change made elsewhere shows within one refresh.
const NEXT_REFRESH = { timeout: 10_000 };

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("a dev follows a test live, checks the proofs, then validates and rates it", async ({
  page,
  request,
}, testInfo) => {
  const email = uniqueEmail("testeuse-live", testInfo);
  const testerName = email.split("@")[0];
  const { campaignId } = await seedOpenCampaign(request, email);
  await playSeededTest(request, email, 1);

  await logIn(page, `dev-${email}`);
  await expect(page).toHaveURL(/\/dev$/);
  await page.goto(`/dev/campagnes/${campaignId}`);
  await expect(page.getByRole("heading", { name: "Suivi en direct" })).toBeVisible();
  const card = page.getByRole("article", { name: new RegExp(testerName, "i") });
  await expect(card).toContainText("1 sur 3 étapes");
  await expect(card.getByRole("button", { name: "Valider et noter" })).toHaveCount(0);

  // The tester finishes while the dev watches.
  await playSeededTest(request, email);
  await expect(card).toContainText("3 sur 3 étapes", NEXT_REFRESH);
  await expect(card).toContainText("Fait pour l'étape 3.");
  await expect(card).toContainText("Le bouton d'export est caché.");
  await expect(card).toContainText("Peut-être");
  await noHorizontalScroll(page);

  // Captures are private files: the dev sees them, enlarged in a dialog.
  const thumbnail = card.getByRole("button", { name: "Agrandir la capture de l'étape 2" });
  await thumbnail.click();
  const preview = page.getByRole("dialog", { name: "Capture de l'étape 2" });
  await expect(preview).toBeVisible();
  const image = preview.getByRole("img");
  await expect(image).toHaveJSProperty("complete", true);
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();
  await expect(thumbnail).toBeFocused();

  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(new URL(r.url()).pathname);
  });
  await card.getByRole("button", { name: "Valider et noter" }).click();
  const dialog = page.getByRole("dialog", { name: `Valider le test de ${testerName}` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Valider" })).toBeChecked();

  // Without a score nothing is sent, and the stars get the focus.
  await dialog.getByRole("button", { name: "Valider le test" }).click();
  const score = dialog.getByRole("radiogroup", { name: "Ta note pour le testeur" });
  await expect(score.getByRole("radio").first()).toBeFocused();
  await expect(score).toHaveAccessibleDescription(/Choisis une note/);

  await score.locator("label", { hasText: "5 sur 5" }).click();
  await dialog.getByLabel("Un mot pour le testeur").fill("Retours précis, merci.");
  await noHorizontalScroll(page);
  await dialog.getByRole("button", { name: "Valider le test" }).dblclick();

  await expect(dialog).toBeHidden();
  await expect(card).toContainText("Validé, rémunération créditée");
  await expect(card).toContainText("Ta note : 5 sur 5");
  await expect(card).toContainText("Retours précis, merci.");
  await expect(card.getByRole("button", { name: "Valider et noter" })).toHaveCount(0);
  await expect(card.getByRole("heading", { name: new RegExp(testerName, "i") })).toBeFocused();
  expect(posts.filter((path) => path.endsWith("/validate/"))).toHaveLength(1);

  // The tester sees the outcome too.
  await page.context().clearCookies();
  await logIn(page, email);
  await expect(page.getByRole("link", { name: /Compta Express/ })).toContainText("Validé");
});

test("a dev rejects a test: no reward, and the tester sees it rejected", async ({ page, request }, testInfo) => {
  const email = uniqueEmail("testeuse-rejet", testInfo);
  const testerName = email.split("@")[0];
  const { campaignId } = await seedOpenCampaign(request, email);
  await playSeededTest(request, email);

  await logIn(page, `dev-${email}`);
  await expect(page).toHaveURL(/\/dev$/);
  await page.goto(`/dev/campagnes/${campaignId}`);
  const card = page.getByRole("article", { name: new RegExp(testerName, "i") });
  await card.getByRole("button", { name: "Valider et noter" }).click();
  const dialog = page.getByRole("dialog", { name: `Valider le test de ${testerName}` });
  await dialog.getByText("Rejeter", { exact: true }).click();
  await expect(dialog).toContainText("n'est pas rémunéré");
  await dialog.getByRole("radiogroup", { name: "Ta note pour le testeur" }).locator("label", { hasText: "2 sur 5" }).click();
  await dialog.getByRole("button", { name: "Rejeter le test" }).click();

  await expect(dialog).toBeHidden();
  await expect(card).toContainText("Rejeté, sans rémunération");
  await expect(card).toContainText("Ta note : 2 sur 5");
  await expect(card.getByRole("button", { name: "Valider et noter" })).toHaveCount(0);

  await page.context().clearCookies();
  await logIn(page, email);
  await expect(page.getByRole("link", { name: /Compta Express/ })).toContainText("Rejeté");
});
