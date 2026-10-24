import { expect, test, type Page } from "@playwright/test";
import { overlaps, scan } from "./helpers";

/** Boîtes visibles de tout ce qu'aucun autocollant ne doit recouvrir. */
async function guardedBoxes(page: Page) {
  return page
    .locator("[data-hero-guard], [data-hero-cta], [data-live-badge], #hero a[href='#boucle']")
    .evaluateAll((els) =>
      els
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
    );
}

async function expectNoStickerOverlap(page: Page) {
  const guarded = await guardedBoxes(page);
  expect(guarded.length).toBeGreaterThan(8);
  // Une seule lecture du DOM pour tous les autocollants (rapide même sous charge).
  const stickers = await page.locator("[data-sticker]").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { text: el.textContent ?? "", box: { x: r.x, y: r.y, width: r.width, height: r.height } };
    }),
  );
  expect(stickers.length).toBeGreaterThan(0);
  for (const { text, box } of stickers) {
    for (const g of guarded) expect(overlaps(box, g), `${text} overlaps ${JSON.stringify(g)}`).toBe(false);
  }
}

const smallScreen = (name: string) => name === "mobile" || name === "tablet";

test("hero copy is server-rendered and CTAs are clickable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tes futurs clients testent ton app\./i);
  await expect(page.getByRole("link", { name: "Je suis développeur" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Je teste et je suis rémunéré" }).first()).toBeVisible();
});

test("mobile layout", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/");
  await page.waitForTimeout(1600);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
  for (const s of await page.locator("[data-sticker]").all()) expect(overlaps(await s.boundingBox(), h1)).toBe(false);
  const ctas = page.locator("[data-hero-cta]:visible");
  await expect(ctas.first()).toHaveAttribute("data-camp", "pro");
});

test("hero CTA order is checked on what is actually visible", async ({ page }) => {
  await page.goto("/");
  const viewport = page.viewportSize()!;
  const hero = page.locator("#hero");
  const dev = await hero.getByRole("link", { name: "Je suis développeur" }).boundingBox();
  const pro = await hero.getByRole("link", { name: "Je teste et je suis rémunéré" }).boundingBox();
  expect(dev).not.toBeNull();
  expect(pro).not.toBeNull();
  await expect(hero.locator("[data-hero-cta]:visible")).toHaveCount(2);
  if (viewport.width < 768) {
    // Mobile : CTA pro empilé au-dessus du CTA dev (§3.2).
    expect(pro!.y + pro!.height).toBeLessThanOrEqual(dev!.y);
  } else {
    // Desktop et tablette : CTA dev devant (à gauche, ou au-dessus s'ils passent à la ligne).
    expect(dev!.x < pro!.x || dev!.y + dev!.height <= pro!.y).toBe(true);
  }
});

test("rendered page has no forbidden content", async ({ page }) => {
  await page.goto("/");
  expect(await scan(await page.locator("body").innerText())).toEqual([]);
});

test("stickers never cover the hero text or the CTAs, and the page never scrolls sideways", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator("[data-sticker]")).toHaveCount(smallScreen(info.project.name) ? 5 : 8);
  await page.waitForTimeout(1600);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const s of await page.locator("[data-sticker]").all()) {
    const box = (await s.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await expectNoStickerOverlap(page);
});

test("stickers still clear the hero text while a CTA camp is hovered", async ({ page }, info) => {
  test.skip(smallScreen(info.project.name), "pas de survol sur écran tactile");
  await page.goto("/");
  await page.waitForTimeout(1600);
  for (const name of ["Je suis développeur", "Je teste et je suis rémunéré"]) {
    await page.locator("#hero").getByRole("link", { name }).hover();
    await page.waitForTimeout(900);
    await expectNoStickerOverlap(page);
  }
});

test("stickers are hidden from assistive tech and the H1 is the first heading", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1200);
  const stickers = page.locator("[data-sticker]");
  expect(await stickers.count()).toBeGreaterThan(0);
  for (const s of await stickers.all()) {
    expect(await s.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true);
  }
  const tree = await page.locator("body").ariaSnapshot();
  const firstHeading = tree.split("\n").find((line) => /^\s*- heading /.test(line));
  expect(firstHeading).toMatch(/heading "Tes futurs clients testent ton app\." \[level=1\]/i);
  expect(tree).not.toContain("Comptable vérifiée");
});

test("live badge shows the server value without JS", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("[data-live-badge]")).toContainText(/\d+ tests? en cours/);
  await context.close();
});

test("mobile menu moves focus in, traps Tab, closes on Escape and gives focus back", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const first = page.locator("[data-mobile-menu]").getByRole("link", { name: "Comment ça marche" });
  await expect(first).toBeFocused();
  const focusIsTrapped = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return !!el && (el.closest("[data-mobile-menu]") !== null || el.getAttribute("aria-label") === "Fermer le menu");
    });
  // 6 liens dans le menu + le bouton de fermeture : 7 tabulations ramènent au lien de tête.
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    expect(await focusIsTrapped()).toBe(true);
  }
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Fermer le menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-mobile-menu]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toBeFocused();
});

test("the check sits above CLIENTS without touching FUTURS", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  const geo = await page.evaluate(() => {
    const words = [...document.querySelectorAll<HTMLElement>(".hero-word")];
    const futurs = words.find((w) => w.textContent === "futurs")!;
    const clients = words.find((w) => w.textContent === "clients")!;
    // Ligne de base de FUTURS : sonde inline-block de hauteur nulle, alignée sur la ligne de base.
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    futurs.appendChild(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();
    const f = futurs.getBoundingClientRect();
    const c = clients.getBoundingClientRect();
    const check = document.querySelector("#hero-title path")!.getBoundingClientRect();
    return { baseline, futurs: { left: f.left, right: f.right }, clients: { left: c.left, right: c.right, top: c.top }, check: { left: check.left, right: check.right, top: check.top, bottom: check.bottom } };
  });
  // Sous la ligne de base de FUTURS (avec une marge pour l'épaisseur du trait arrondi).
  expect(geo.check.top).toBeGreaterThanOrEqual(geo.baseline + 2);
  // Au-dessus du mot CLIENTS : centre horizontal dans le mot, bas du tracé au niveau du haut des lettres.
  const center = (geo.check.left + geo.check.right) / 2;
  expect(center).toBeGreaterThan(geo.clients.left);
  expect(center).toBeLessThan(geo.clients.right);
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`no console or hydration error (reduced motion: ${reducedMotion})`, async ({ browser }, info) => {
    const context = await browser.newContext({ ...info.project.use, reducedMotion });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("jobs marquee lists verified jobs", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("[data-jobs-marquee]");
  await band.scrollIntoViewIfNeeded();
  await expect(band.getByText("MÉTIERS VÉRIFIÉS SUR")).toBeVisible();
  await expect(band.getByText("Comptable").first()).toBeVisible();
  await expect(band.getByText("Métier vérifié par CV, LinkedIn ou justificatif.")).toBeVisible();
  // Le contenu doublé est décoratif : les lecteurs d'écran lisent la liste une seule fois.
  await expect(band.getByRole("listitem")).toHaveCount(14);
  await expect(page.locator("[data-marquee-track]")).toHaveCSS("animation-name", "marquee");
});

test("jobs marquee is a static centered list with reduced motion", async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
  const track = page.locator("[data-marquee-track]");
  await expect(track).toHaveCSS("animation-name", "none");
  await expect(track).toHaveCSS("flex-wrap", "wrap");
  await expect(track).toHaveCSS("justify-content", "center");
  await expect(page.locator("[data-marquee-track] [aria-hidden='true'][data-marquee-copy]")).toBeHidden();
  // Les 14 métiers sont dans le viewport, sans débordement horizontal.
  const pills = page.locator("[data-marquee-track] [data-pill][data-copy='0']");
  await expect(pills).toHaveCount(14);
  const vw = page.viewportSize()!.width;
  const boxes = await pills.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ l: r.left, r: r.right })));
  for (const b of boxes) {
    expect(b.l).toBeGreaterThanOrEqual(0);
    expect(b.r).toBeLessThanOrEqual(vw);
  }
  const overflow = await page.locator("[data-marquee-copy='']").first().evaluate((e) => e.scrollWidth - e.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.locator("[data-jobs-marquee]").screenshot({
    path: `../.superpowers/sdd/2026-10-23-socle-et-landing/shots/task5-reduced-${info.project.name}.png`,
  });
  await context.close();
});

test("jobs marquee stamps a visible job", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("[data-jobs-marquee] .marquee-band");
  await band.scrollIntoViewIfNeeded();
  const stamped = page.locator("[data-pill][data-stamped='true']");
  await expect(stamped).toHaveCount(1, { timeout: 6000 });
  const inside = await stamped.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const b = el.closest(".marquee-band")!.getBoundingClientRect();
    return r.left >= b.left && r.right <= b.right;
  });
  expect(inside).toBe(true);
  // Le tampon retombe après 1200 ms.
  await expect(stamped).toHaveCount(0, { timeout: 3000 });
});

test("jobs marquee pauses on hover", async ({ page }, info) => {
  test.skip(info.project.name === "mobile" || info.project.name === "tablet", "pas de survol sur tactile");
  await page.goto("/");
  const band = page.locator("[data-jobs-marquee] .marquee-band");
  await band.scrollIntoViewIfNeeded();
  const track = page.locator("[data-marquee-track]");
  await expect(track).toHaveCSS("animation-play-state", "running");
  await band.hover();
  await expect(track).toHaveCSS("animation-play-state", "paused");
});
