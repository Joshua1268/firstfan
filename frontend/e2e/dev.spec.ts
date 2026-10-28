import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures";
import { TINY_PNG, createVerifiedTester, signUpDev, uniqueEmail } from "./helpers";
import type { Page } from "@playwright/test";

const STEPS = [
  "Crée une facture pour un client",
  "Ajoute une dépense avec son justificatif",
  "Exporte le bilan du mois",
];

test.beforeEach(({}, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
});

test("a dev deposits an app, gets its certificate and writes a scenario", async ({ page }, testInfo) => {
  await signUpDev(page, uniqueEmail("dev-projects", testInfo));
  await expect(page.getByText("Aucun projet pour l'instant")).toBeVisible();
  await page.getByRole("link", { name: "Déposer une app" }).click();

  await expect(page).toHaveURL(/\/dev\/projets\/nouveau$/);
  await page.getByLabel("Nom de l'app").fill("Compta Express");
  await page.getByLabel("Lien de l'app").fill("https://compta.example");
  await page.getByLabel("Description").fill("Suivi des factures et des dépenses pour les petites entreprises.");
  await page
    .getByLabel("Captures d'écran")
    .setInputFiles([{ name: "accueil.png", mimeType: "image/png", buffer: TINY_PNG }]);
  await page.getByRole("button", { name: "Déposer mon app" }).click();

  await expect(page).toHaveURL(/\/dev\/projets\/\d+$/);
  const fingerprint = (await page.getByTestId("fingerprint").innerText()).trim();
  expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Télécharger" }).click(),
  ]);
  expect(await readFile((await download.path())!, "utf8")).toContain(fingerprint);

  await expect(page.getByText("Pas encore détecté")).toBeVisible();
  // main clips its overflow, so check that every card fits in the viewport.
  const cardsFit = await page.evaluate(() =>
    [...document.querySelectorAll("main section")].every((s) => s.getBoundingClientRect().right <= window.innerWidth),
  );
  expect(cardsFit).toBe(true);

  await page.getByLabel("Métier ciblé").selectOption("Comptable");
  await page.getByLabel("Nombre de testeurs").fill("3");
  await page.getByLabel("Étape 1", { exact: true }).fill(STEPS[0]);
  await page.getByRole("button", { name: "Ajouter une étape" }).click();
  await page.getByLabel("Étape 2", { exact: true }).fill(STEPS[1]);
  await page.getByRole("button", { name: "Ajouter une étape" }).click();
  await page.getByLabel("Étape 3", { exact: true }).fill(STEPS[2]);
  await page.getByRole("button", { name: "Créer la campagne" }).click();

  await expect(page).toHaveURL(/\/dev\/campagnes\/\d+$/);
  const steps = page.getByRole("list", { name: "Étapes du scénario" }).getByRole("listitem");
  await expect(steps).toHaveText(STEPS);
  await expect(page.getByTestId("campaign-total")).toHaveText(/^15\s000\sFCFA$/);
});

test("the printable certificate shows the fingerprint", async ({ page }, testInfo) => {
  await signUpDev(page, uniqueEmail("dev-print", testInfo));
  await page.goto("/dev/projets/nouveau");
  await page.getByLabel("Nom de l'app").fill("Stock Facile");
  await page.getByLabel("Lien de l'app").fill("https://stock.example");
  await page.getByLabel("Description").fill("Inventaire pour les boutiques.");
  await page.getByRole("button", { name: "Déposer mon app" }).click();
  await expect(page).toHaveURL(/\/dev\/projets\/\d+$/);
  const fingerprint = (await page.getByTestId("fingerprint").innerText()).trim();

  await page.getByRole("link", { name: "Version imprimable" }).click();
  await expect(page).toHaveURL(/\/dev\/projets\/\d+\/certificat$/);
  await expect(page.getByText(fingerprint)).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("header")).toBeHidden();
});

test("the scenario editor keeps the keyboard focus and flags every empty field", async ({ page }, testInfo) => {
  await signUpDev(page, uniqueEmail("dev-steps", testInfo));
  await page.goto("/dev/projets/nouveau");
  await page.getByLabel("Nom de l'app").fill("Agenda Pro");
  await page.getByLabel("Lien de l'app").fill("https://agenda.example");
  await page.getByLabel("Description").fill("Rendez-vous pour les cabinets.");
  await page.getByRole("button", { name: "Déposer mon app" }).click();
  await expect(page).toHaveURL(/\/dev\/projets\/\d+$/);

  await page.getByRole("button", { name: "Créer la campagne" }).click();
  await expect(page.getByText("Choisis un métier.")).toBeVisible();
  await expect(page.getByLabel("Étape 1", { exact: true })).toHaveAccessibleDescription(/Remplis chaque étape/);

  await page.getByRole("button", { name: "Ajouter une étape" }).click();
  await expect(page.getByLabel("Étape 2", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Retirer l'étape 2" }).click();
  await expect(page.getByLabel("Étape 1", { exact: true })).toBeFocused();

  await page.getByLabel("Étape 1", { exact: true }).fill("Prends un rendez-vous");
  await page.getByRole("button", { name: "Ajouter une étape" }).click();
  await page.getByRole("button", { name: "Descendre l'étape 1" }).click();
  await expect(page.getByLabel("Étape 2", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Étape 2", { exact: true })).toHaveValue("Prends un rendez-vous");
});

test("an unknown project shows a clear message", async ({ page }, testInfo) => {
  await signUpDev(page, uniqueEmail("dev-404", testInfo));
  await page.goto("/dev/projets/999999999");
  await expect(page.getByText("Projet introuvable.")).toBeVisible();
});

async function createDraftCampaign(page: Page, testersWanted: number) {
  await page.goto("/dev/projets/nouveau");
  await page.getByLabel("Nom de l'app").fill("Compta Express");
  await page.getByLabel("Lien de l'app").fill("https://compta.example");
  await page.getByLabel("Description").fill("Suivi des factures pour les petites entreprises.");
  await page.getByRole("button", { name: "Déposer mon app" }).click();
  await expect(page).toHaveURL(/\/dev\/projets\/\d+$/);
  await page.getByLabel("Métier ciblé").selectOption("Comptable");
  await page.getByLabel("Nombre de testeurs").fill(String(testersWanted));
  await page.getByLabel("Étape 1", { exact: true }).fill(STEPS[0]);
  await page.getByRole("button", { name: "Créer la campagne" }).click();
  await expect(page).toHaveURL(/\/dev\/campagnes\/\d+$/);
}

// Other runs leave verified testers behind: each test picks its own by a unique name.
function newTesters(count: number, testInfo: { project: { name: string } }) {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  return Array.from({ length: count }, (_, i) => {
    const name = `comptable${i + 1}-${stamp}`;
    createVerifiedTester(`${name}@e2e.test`, "Comptable");
    return new RegExp(name, "i");
  });
}

test("a dev picks two testers, pays and the invitations are sent", async ({ page }, testInfo) => {
  const testers = newTesters(2, testInfo);
  await signUpDev(page, uniqueEmail("dev-pick", testInfo));
  await createDraftCampaign(page, 3);

  await expect(page.getByText("0 sur 3")).toBeVisible();
  for (const tester of testers) await page.getByRole("checkbox", { name: tester }).check();
  await expect(page.getByText("2 sur 3")).toBeVisible();
  await page.getByRole("button", { name: "Payer et envoyer les invitations" }).click();

  await expect(page).toHaveURL(/\/paiement\/simule\/[\w-]+$/);
  await expect(page.getByText("Paiement simulé : aucun argent ne circule")).toBeVisible();
  await expect(page.getByTestId("payment-amount")).toHaveText(/^10\s000\sFCFA$/);
  await page.getByRole("button", { name: "Confirmer le paiement" }).click();

  await expect(page).toHaveURL(/\/dev\/campagnes\/\d+$/);
  await expect(page.getByText("Ouverte", { exact: true })).toBeVisible();
  const invitations = page.getByRole("list", { name: "Invitations" }).getByRole("listitem");
  await expect(invitations).toHaveCount(2);
  for (const tester of testers) await expect(invitations.filter({ hasText: tester })).toContainText("Envoyée");
  await expect(page.getByRole("button", { name: "Payer et envoyer les invitations" })).toHaveCount(0);
  await expect(page.getByTestId("campaign-testers")).toHaveText("2");
  await expect(page.getByTestId("campaign-total")).toHaveText(/^10\s000\sFCFA$/);
});

test("a cancelled payment keeps the campaign in draft", async ({ page }, testInfo) => {
  const [tester] = newTesters(1, testInfo);
  await signUpDev(page, uniqueEmail("dev-cancel", testInfo));
  await createDraftCampaign(page, 1);

  await page.getByRole("checkbox", { name: tester }).check();
  const pay = page.getByRole("button", { name: "Payer et envoyer les invitations" });

  // The list can be long: a refused selection must show next to the pay button.
  const refused = { tester_ids: ["Testeur non disponible pour cette campagne."] };
  await page.route("**/api/campaigns/*/selection/", (route) => route.fulfill({ status: 400, json: refused }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await pay.click();
  await expect(page.getByText("Testeur non disponible pour cette campagne.")).toBeInViewport();
  await page.unroute("**/api/campaigns/*/selection/");

  await pay.click();
  await expect(page).toHaveURL(/\/paiement\/simule\/[\w-]+$/);
  await page.getByRole("button", { name: "Annuler" }).click();

  await expect(page).toHaveURL(/\/dev\/campagnes\/\d+$/);
  await expect(page.getByText("Brouillon", { exact: true })).toBeVisible();
  await expect(page.getByText(/Paiement annulé/)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: tester })).toBeChecked();
});
