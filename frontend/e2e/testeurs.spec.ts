import { expect, test } from "./fixtures";
import { scan } from "./helpers";

const H1 = "Ton métier fait les bonnes apps.";

test("testers page renders in French with its own title, description and H1", async ({ page }) => {
  const res = await page.goto("/testeurs");
  expect(res?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page).toHaveTitle(/Devenir testeur rémunéré/);
  await expect(page.locator("meta[name='description']")).toHaveAttribute("content", /téléphone.*rémunéré/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(H1, { ignoreCase: true });
  // Expertise, pay, flexibility, trust, then apply.
  const order = ["#ton-metier", "#remuneration", "#a-ton-rythme", "#confiance", "#cta-final"];
  const tops = await Promise.all(
    order.map((s) => page.locator(s).evaluate((el) => el.getBoundingClientRect().top + window.scrollY)),
  );
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
  await expect(page.locator("#remuneration")).toContainText("Chaque test est rémunéré.");
  await expect(page.locator("#remuneration")).toContainText("Wave, Orange Money ou MTN MoMo");
  await expect(page.locator("#remuneration")).toContainText("Le dev valide ton test");
});

test("one action, framed as an application, leads to the tester sign-up", async ({ page }) => {
  await page.goto("/testeurs");
  const ctas = page.locator("main [data-apply-cta]");
  await expect(ctas).toHaveCount(2); // same action in the hero and the apply section
  for (const c of await ctas.all()) {
    await expect(c).toHaveAttribute("href", "/inscription?role=tester");
    await expect(c).toHaveText(/Proposer mon profil/);
  }
  // No other primary action and no competing dev button.
  await expect(page.locator("main").getByRole("link", { name: "Je suis développeur" })).toHaveCount(0);
  // The hero button is above the fold.
  const box = (await ctas.first().boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await ctas.first().click();
  await expect(page).toHaveURL(/\/inscription\?role=tester$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Les inscriptions ouvrent bientôt.");
});

test("testers page shows no amount and no forbidden content", async ({ page }) => {
  await page.goto("/testeurs");
  expect(await scan(await page.locator("body").innerText())).toEqual([]);
  expect(await page.locator("body").innerText()).not.toMatch(/fcfa|xof|€|\$/i);
});

test("testers page never scrolls sideways", async ({ page }) => {
  await page.goto("/testeurs");
  const width = page.viewportSize()!.width;
  for (const id of ["hero", "ton-metier", "remuneration", "a-ton-rythme", "confiance", "cta-final"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), id).toBe(true);
    // Mobile Chrome widens the layout viewport when something overflows, which innerWidth reveals.
    expect(await page.evaluate(() => window.innerWidth), id).toBe(width);
  }
});

test("nav and footer anchors point back to the home sections, and every link works", async ({ page, request }) => {
  await page.goto("/testeurs");
  const anchors = await page
    .locator("header a[href*='#'], footer a[href*='#']")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
  expect(anchors.length).toBeGreaterThan(0);
  for (const href of anchors) expect(href, href).toMatch(/^\/#/);
  await expect(page.locator("header nav a[href='/testeurs']").first()).toHaveAttribute("aria-current", "page");
  // The target sections exist on the home page.
  const ids = [...new Set(anchors.map((h) => h.slice(1)))];
  const internal = await page
    .locator("a[href]")
    .evaluateAll((els) => [
      ...new Set(
        els
          .map((e) => e.getAttribute("href")!)
          .filter((h) => h.startsWith("/") && !h.startsWith("//") && !h.includes("#")),
      ),
    ]);
  for (const href of internal) expect((await request.get(href)).status(), href).toBe(200);
  await page.goto("/");
  for (const id of ids) await expect(page.locator(id)).toHaveCount(1);
});

test("testers page reads fully without JavaScript", async ({ browser }, info) => {
  const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto((info.project.use.baseURL ?? "http://127.0.0.1:3100") + "/testeurs");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const t of [
    "Personne ne connaît ton travail mieux que toi.",
    "Chaque test est rémunéré.",
    "Depuis ton téléphone, quand tu veux.",
    "Du sérieux, dans les deux sens.",
    "Ton métier compte.",
  ])
    await expect(page.getByRole("heading", { name: t })).toBeVisible();
  await expect(page.getByText("Le dev valide ton test")).toBeVisible();
  await expect(page.locator("main [data-apply-cta]").first()).toBeVisible();
  await ctx.close();
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`testers page: no console or hydration error (reduced motion: ${reducedMotion})`, async ({ browser }, info) => {
    const context = await browser.newContext({ ...info.project.use, reducedMotion });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto((info.project.use.baseURL ?? "http://127.0.0.1:3100") + "/testeurs");
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    if (reducedMotion === "reduce") {
      // Everything is visible at once.
      await page.locator("#remuneration").scrollIntoViewIfNeeded();
      await expect(page.getByText("Tu es payé en mobile money")).toBeVisible();
    }
    await context.close();
  });
}
