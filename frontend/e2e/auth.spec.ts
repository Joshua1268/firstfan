import { expect, test } from "./fixtures";
import { PASSWORD, scan, uniqueEmail } from "./helpers";

// Auth does not depend on the layout: two viewports are enough, and they stay under the login throttle.
test.beforeEach(({}, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
});

test("a dev signs up, lands on /dev, logs out and logs in again", async ({ page }, testInfo) => {
  const email = uniqueEmail("dev", testInfo);
  await page.goto("/inscription?role=dev");
  await page.getByLabel("Prénom").fill("Awa");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/dev$/);
  await expect(page.getByText("Aucun projet pour l'instant")).toBeVisible();
  expect(await scan(await page.locator("body").innerText())).toEqual([]);

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dev$/);
});

test("a tester signs up, fills the profile and waits for verification", async ({ page }, testInfo) => {
  await page.goto("/inscription?role=tester");
  await page.getByLabel("Prénom").fill("Koffi");
  await page.getByLabel("Email").fill(uniqueEmail("tester", testInfo));
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByLabel(/J'accepte que mes informations/).check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/testeur\/profil$/);
  await page.getByRole("button", { name: "Enregistrer mon profil" }).click();
  await expect(page.getByLabel("Métier")).toBeFocused();
  await expect(page.getByLabel("Métier")).toHaveAccessibleDescription("Choisis ton métier.");
  await expect(page.getByLabel("Numéro mobile money")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/testeur\/profil$/);

  await page.getByLabel("Métier").selectOption("Comptable");
  await page.getByLabel("Commune").fill("Cocody");
  await page.getByLabel("Profil LinkedIn").fill("https://www.linkedin.com/in/koffi");
  await page.getByLabel("Numéro mobile money").fill("0700000042");
  await page.getByRole("button", { name: "Enregistrer mon profil" }).click();

  await expect(page).toHaveURL(/\/testeur$/);
  await expect(page.getByText("Prêt à tester")).toBeVisible();
  await expect(page.getByText("Aucune invitation pour l'instant")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("an anonymous visitor of /dev is sent to the login page", async ({ page }) => {
  await page.goto("/dev");
  await expect(page).toHaveURL(/\/connexion\?next=%2Fdev$/);
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
});

test("a taken email shows its error under the email field", async ({ page, request }, testInfo) => {
  const email = uniqueEmail("taken", testInfo);
  // Create the account through the API first, with the csrf cookie Django expects.
  await request.get("/api/auth/csrf/");
  const token = (await request.storageState()).cookies.find((c) => c.name === "csrftoken")!.value;
  const created = await request.post("/api/auth/register/", {
    data: { email, password: PASSWORD, first_name: "Awa", role: "dev" },
    headers: { "X-CSRFToken": token },
  });
  expect(created.status()).toBe(201);

  await page.goto("/inscription?role=dev");
  await page.getByLabel("Prénom").fill("Awa");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  const field = page.getByLabel("Email");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toHaveAccessibleDescription("Un compte existe déjà avec cet email.");
  await expect(field).toBeFocused();
  await expect(page).toHaveURL(/\/inscription\?role=dev$/);
});

test("sign-up without a role offers both accounts", async ({ page }) => {
  await page.goto("/inscription");
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Déjà un compte ? Connecte-toi" })).toBeVisible();
  await page.getByRole("link", { name: "Je suis développeur" }).click();
  await expect(page).toHaveURL(/role=dev$/);
  await expect(page.getByRole("button", { name: "Créer mon compte" })).toBeVisible();
});

test("a wrong password shows a clear message", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill("personne@e2e.test");
  await page.getByLabel("Mot de passe").fill("pas-le-bon");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Email ou mot de passe incorrect.");
});

test("the Google button stays hidden while Google sign-in is off", async ({ page }) => {
  for (const path of ["/connexion", "/inscription?role=tester"]) {
    const status = page.waitForResponse((r) => r.url().endsWith("/api/auth/google/"));
    await page.goto(path);
    expect(await (await status).json()).toEqual({ enabled: false });
    await expect(page.getByText("Continuer avec Google")).toHaveCount(0);
  }
});
