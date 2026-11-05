import { expect, test } from "./fixtures";
import { SCENARIO, TINY_PNG, logIn, seedOpenCampaign, uniqueEmail } from "./helpers";
import type { Page } from "@playwright/test";

// The guided test is made for the phone.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
});

const FAKE_PNG = { name: "capture.png", mimeType: "image/png", buffer: Buffer.from("%PDF-1.4 not an image") };

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function doStep(page: Page, number: number) {
  await expect(page.getByRole("heading", { name: `Étape ${number} sur 3` })).toHaveAccessibleName(
    `Étape ${number} sur 3 ${SCENARIO[number - 1]}`,
  );
  await page.getByLabel("Ta réponse").fill(`C'est fait pour l'étape ${number}.`);
  // No capture attribute: on a phone the tester picks a screenshot from the gallery.
  await expect(page.getByLabel("Capture d'écran")).not.toHaveAttribute("capture");
  await page
    .getByLabel("Capture d'écran")
    .setInputFiles({ name: "capture.png", mimeType: "image/png", buffer: TINY_PNG });
  await expect(page.getByAltText("Aperçu du fichier choisi")).toBeVisible();
  await page.getByRole("button", { name: "Valider l'étape" }).click();
}

test("a tester accepts, follows the steps, resumes after a reload and sends the test", async ({
  page,
  request,
}, testInfo) => {
  const email = uniqueEmail("testeuse", testInfo);
  await seedOpenCampaign(request, email);
  await logIn(page, email);
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(new URL(r.url()).pathname);
  });
  const postCount = (end: string) => posts.filter((path) => path.endsWith(end)).length;

  await expect(page).toHaveURL(/\/testeur$/);
  await page.getByRole("link", { name: /Compta Express/ }).click();
  await expect(page).toHaveURL(/\/testeur\/invitations\/\d+$/);
  await expect(page.getByText(/^3\s500\sFCFA$/)).toBeVisible();
  await expect(page.getByText(SCENARIO[0])).toHaveCount(0);
  await noHorizontalScroll(page);

  await page.getByRole("button", { name: "Accepter et commencer" }).click();
  const nda = page.getByLabel("Je m'engage à ne pas divulguer l'app ni son contenu");
  await expect(nda).toBeFocused();
  await expect(nda).toHaveAccessibleDescription(/Coche l'engagement/);
  await nda.check();
  await page.getByRole("button", { name: "Accepter et commencer" }).click();

  await expect(page.getByRole("link", { name: "Ouvrir l'app" })).toHaveAttribute("href", /\?ff_t=/);
  await expect(page.getByRole("heading", { name: "Étape 1 sur 3" })).toBeFocused();

  // A file that is not an image is refused, with the reason under the field.
  await page.getByLabel("Capture d'écran").setInputFiles(FAKE_PNG);
  await page.getByRole("button", { name: "Valider l'étape" }).click();
  await expect(page.getByLabel("Capture d'écran")).toBeFocused();
  await expect(page.getByLabel("Capture d'écran")).toHaveAccessibleDescription(/Format refusé/);
  await noHorizontalScroll(page);
  // Picking another file clears the error.
  await page
    .getByLabel("Capture d'écran")
    .setInputFiles({ name: "capture.png", mimeType: "image/png", buffer: TINY_PNG });
  await expect(page.getByLabel("Capture d'écran")).not.toHaveAccessibleDescription(/Format refusé/);

  await doStep(page, 1);
  await doStep(page, 2);
  await expect(page.getByRole("heading", { name: "Étape 3 sur 3" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Étape 3 sur 3" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Étape 1, faite : la modifier" })).toBeVisible();

  // A done step stays editable without a new capture.
  await page.getByRole("button", { name: "Étape 1, faite : la modifier" }).click();
  await expect(page.getByLabel("Ta réponse")).toHaveValue("C'est fait pour l'étape 1.");
  await page.getByLabel("Ta réponse").fill("Facture créée sans souci.");
  await page.getByRole("button", { name: "Valider l'étape" }).click();
  await expect(page.getByRole("heading", { name: "Étape 3 sur 3" })).toBeVisible();

  await page.getByLabel("Ta réponse").fill("Export en PDF.");
  await page
    .getByLabel("Capture d'écran")
    .setInputFiles({ name: "capture.png", mimeType: "image/png", buffer: TINY_PNG });
  await page.getByRole("button", { name: "Valider l'étape" }).dblclick();

  await expect(page.getByRole("heading", { name: "Ton avis" })).toBeFocused();
  expect(postCount("/steps/3/")).toBe(1);
  await page.getByRole("button", { name: "Envoyer mon test" }).click();
  const usefulness = page.getByRole("radiogroup", { name: "Utilité pour ton métier" });
  await expect(usefulness.getByRole("radio").first()).toBeFocused();
  await expect(usefulness).toHaveAccessibleDescription(/Choisis une note/);

  await usefulness.locator("label", { hasText: "4 sur 5" }).click();
  await expect(usefulness).not.toHaveAccessibleDescription(/Choisis une note/);
  await page.getByLabel("Ce qui t'a bloqué").fill("Le bouton d'export est caché.");
  await page.getByText("Peut-être", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Peut-être" })).toBeChecked();
  await page.getByLabel("Ton avis sur l'app").fill("Pratique pour mes clients.");
  await page.getByRole("radiogroup", { name: "Ta note pour le dev" }).locator("label", { hasText: "5 sur 5" }).click();
  await page.getByLabel("Un mot pour le dev").fill("Merci !");
  await noHorizontalScroll(page);
  await page.getByRole("button", { name: "Envoyer mon test" }).dblclick();

  await expect(page.getByText("En attente de validation par le dev")).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  expect(postCount("/submit/")).toBe(1);

  await page.getByRole("link", { name: "Retour à mes invitations" }).click();
  await expect(page.getByRole("link", { name: /Compta Express/ })).toContainText("Test envoyé");
  await noHorizontalScroll(page);
});

test("a tester declines an invitation", async ({ page, request }, testInfo) => {
  const email = uniqueEmail("testeur-refus", testInfo);
  await seedOpenCampaign(request, email);
  await logIn(page, email);

  await page.getByRole("link", { name: /Compta Express/ }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Refuser" }).click();
  await expect(page.getByText("Tu as refusé cette invitation.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir l'app" })).toHaveCount(0);
});
