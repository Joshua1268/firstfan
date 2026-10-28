import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures";
import { TINY_PNG, signUpDev, uniqueEmail } from "./helpers";

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

test("an unknown project shows a clear message", async ({ page }, testInfo) => {
  await signUpDev(page, uniqueEmail("dev-404", testInfo));
  await page.goto("/dev/projets/999999999");
  await expect(page.getByText("Projet introuvable.")).toBeVisible();
});
