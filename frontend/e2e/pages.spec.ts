import { expect, test } from "./fixtures";
import { scan } from "./helpers";

/** Toutes les URL internes (hors ancres) des liens de la page, avec leur nombre d'occurrences. */
async function internalHrefs(page: import("@playwright/test").Page) {
  return page.locator("a[href]").evaluateAll((els) =>
    [...new Set(els.map((e) => e.getAttribute("href")!).filter((h) => h.startsWith("/") && !h.startsWith("//")))],
  );
}

test("the API rewrite keeps Django's trailing slash: /api/health/ answers 200 JSON through Next", async ({ request }) => {
  const res = await request.get("/api/health/", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  expect(await res.json()).toEqual({ status: "ok", db: true });
  // Sans barre finale : une seule redirection de Django, puis 200 (aucune boucle).
  const bare = await request.get("/api/health", { maxRedirects: 3 });
  expect(bare.status()).toBe(200);
});

test("public stats answer through the same origin, with and without trailing slash", async ({ request }) => {
  for (const path of ["/api/public/stats", "/api/public/stats/"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(200);
    expect(Object.keys(await res.json()).sort()).toEqual(["apps_tested", "demo", "tests_in_progress", "verified_testers"]);
  }
});

test("every CTA, nav and footer link of the landing leads to a real page (no 404)", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await internalHrefs(page);
  for (const expected of ["/inscription?role=dev", "/inscription?role=tester", "/connexion", "/confidentialite", "/contact"])
    expect(hrefs).toContain(expected);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

const PAGES = [
  { path: "/inscription?role=dev", h1: "Les inscriptions ouvrent bientôt.", text: "Inscription · Développeur" },
  { path: "/inscription?role=tester", h1: "Les inscriptions ouvrent bientôt.", text: "Inscription · Testeur" },
  { path: "/inscription", h1: "Les inscriptions ouvrent bientôt.", text: "Aucun formulaire" },
  { path: "/connexion", h1: "La connexion arrive avec les inscriptions.", text: "Aucun compte n'existe encore" },
  { path: "/confidentialite", h1: "Tes données, en clair.", text: "Version provisoire" },
  { path: "/contact", h1: "Écris-nous.", text: "Par e-mail" },
] as const;

for (const p of PAGES) {
  test(`page ${p.path}: French, honest, no form, links all work`, async ({ page, request }) => {
    const res = await page.goto(p.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
    await expect(page.locator("main")).toContainText(p.text);
    // Placeholder honnête : aucun champ qui ferait croire qu'une inscription ou une connexion fonctionne.
    await expect(page.locator("form, input, textarea, select")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Retour à l'accueil" }).first()).toBeVisible();
    expect(await scan(await page.locator("body").innerText())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const href of await internalHrefs(page)) expect((await request.get(href)).status(), href).toBe(200);
  });
}

test("contact page publishes no personal address", async ({ page }) => {
  await page.goto("/contact");
  const text = await page.locator("main").innerText();
  const emails = text.match(/[^\s@]+@[^\s@]+/g) ?? [];
  expect(emails).toEqual(["contact@[domaine]"]);
  await expect(page.locator("a[href^='mailto:']")).toHaveCount(0);
});

test("unknown pages get the French 404 in the site's design", async ({ page }) => {
  const res = await page.goto("/cette-page-nexiste-pas");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cette page n'existe pas.");
  await expect(page.locator("body")).not.toContainText("This page could not be found");
  expect(await scan(await page.locator("body").innerText())).toEqual([]);
  await page.getByRole("link", { name: "Retour à l'accueil" }).first().click();
  await expect(page).toHaveURL(/\/$/);
});
