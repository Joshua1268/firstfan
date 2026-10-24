import { expect, test, type Page } from "@playwright/test";
import { overlaps, scan, scrollStageTo } from "./helpers";

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
  // Chrome mobile élargit la fenêtre de mise en page (page dézoomée) si un élément déborde : innerWidth le trahit.
  expect(await page.evaluate(() => window.innerWidth)).toBe(375);
  const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
  for (const s of await page.locator("[data-sticker]").all()) expect(overlaps(await s.boundingBox(), h1)).toBe(false);
  const ctas = page.locator("[data-hero-cta]:visible");
  await expect(ctas.first()).toHaveAttribute("data-camp", "pro");
});

test("hero CTA order is checked on what is actually visible", async ({ page }) => {
  await page.goto("/");
  const viewport = page.viewportSize()!;
  const hero = page.locator("#hero");
  // Les deux boîtes sont lues ensemble, polices chargées : sinon un échange de police entre les deux lectures
  // (machine chargée) peut faire passer les CTA à la ligne entre deux mesures.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1100); // fin de l'entrée CSS des CTA (560 ms + 420 ms)
  const [dev, pro] = await Promise.all([
    hero.getByRole("link", { name: "Je suis développeur" }).boundingBox(),
    hero.getByRole("link", { name: "Je teste et je suis rémunéré" }).boundingBox(),
  ]);
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
  // Chrome mobile élargit la fenêtre de mise en page (page dézoomée) si un élément déborde : innerWidth le trahit.
  expect(await page.evaluate(() => window.innerWidth)).toBe(page.viewportSize()!.width);
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
  for (const sel of ["[data-marquee-track] .marquee-list", ".marquee-band"]) {
    const m = await page.locator(sel).first().evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    expect(m.cw, `${sel} clientWidth`).toBeGreaterThan(0);
    expect(m.sw, `${sel} scrollWidth`).toBeLessThanOrEqual(m.cw);
  }
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

test("stage scenes advance with scroll", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("[data-stage]");
  await scrollStageTo(page, 0.05);
  await expect(stage).toHaveAttribute("data-scene", "loop");
  await scrollStageTo(page, 0.4);
  await expect(stage).toHaveAttribute("data-scene", "step1");
  await scrollStageTo(page, 0.92);
  await expect(stage).toHaveAttribute("data-scene", "step4");
});

test("stage jump back", async ({ page }) => {
  await page.goto("/");
  await scrollStageTo(page, 0.92);
  await page.getByRole("button", { name: "Boucle" }).click();
  await page.waitForTimeout(1200);
  await expect(page.locator("[data-stage]")).toHaveAttribute("data-scene", "loop");
  await expect(page.locator("[data-scene-text]")).toHaveCount(1);
});

test("skip story link goes to pro section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Passer l'histoire" }).click();
  await expect(page.locator("#pro")).toBeInViewport();
});

test("stage threshold choreographies reverse when scrolling back up", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("[data-stage]");
  const read = () =>
    page.evaluate(() => {
      const arc = document.querySelector<SVGPathElement>("[data-stage] [data-arc]")!;
      const color = document.querySelector<HTMLElement>("[data-stage] [data-card-color]")!;
      return { dash: parseFloat(getComputedStyle(arc).strokeDashoffset), color: parseFloat(getComputedStyle(color).opacity) };
    });
  await scrollStageTo(page, 0.3);
  await expect(stage).toHaveAttribute("data-scene", "voices");
  // Après la cassure : arcs raccourcis, carte en couleur.
  await expect.poll(async () => (await read()).dash).toBeGreaterThan(5);
  await expect.poll(async () => (await read()).color).toBeGreaterThan(0.95);
  await scrollStageTo(page, 0.1);
  await expect(stage).toHaveAttribute("data-scene", "loop");
  // Sous 0.185 : les arcs se referment et la carte redevient grise.
  await expect.poll(async () => (await read()).dash, { timeout: 8000 }).toBeLessThan(0.5);
  await expect.poll(async () => (await read()).color, { timeout: 8000 }).toBeLessThan(0.05);
});

test("stage scene text for steps 01 to 04 is in the HTML without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  for (const title of [
    "Des pros de ton métier cible. Vérifiés.",
    "Un parcours guidé, des preuves horodatées.",
    "Des avis francs, pas de la politesse.",
    "Pas des likes. Des gens qui reviennent.",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await context.close();
});

test("server HTML has a single heading per stage scene", async ({ request }) => {
  const html = await (await request.get("/")).text();
  for (const title of ["Et si on cassait la boucle", "Des pros de ton métier cible. Vérifiés.", "Pas des likes. Des gens qui reviennent."]) {
    const count = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].filter((m) => m[1].replace(/<[^>]+>/g, "").includes(title)).length;
    expect(count, title).toBe(1);
  }
});

test("hydrated page keeps a single heading per stage scene", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-stage-transcript]")).toBeAttached();
  await expect(page.getByRole("heading", { name: "Des pros de ton métier cible. Vérifiés." })).toHaveCount(1);
});

test("screen readers get every stage scene in reading order", async ({ page }) => {
  await page.goto("/");
  // La transcription est montée après l'hydratation.
  await expect(page.locator("[data-stage-transcript]")).toBeAttached();
  const tree = await page.locator("[data-stage]").ariaSnapshot();
  const order = [
    "On te dit",
    "Et si on cassait la boucle",
    "Des pros de ton métier cible",
    "Un parcours guidé",
    "Des avis francs",
    "Pas des likes",
  ].map((t) => tree.indexOf(t));
  for (const i of order) expect(i).toBeGreaterThan(-1);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test("reduced-motion fallback keeps the required text uncovered", async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
  await expect(page.locator("[data-static-scene]")).toHaveCount(7);
  const boxes = (scene: string, sel: string) =>
    page.locator(`[data-static-scene="${scene}"] ${sel}`).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { text: el.textContent ?? "", box: { x: r.x, y: r.y, width: r.width, height: r.height } };
      }),
    );
  const noOverlap = (a: Awaited<ReturnType<typeof boxes>>, b: Awaited<ReturnType<typeof boxes>>) => {
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    for (const x of a) for (const y of b) if (x !== y) expect(overlaps(x.box, y.box), `${x.text} / ${y.text}`).toBe(false);
  };
  // Boucle : labels lisibles, compteur de tours dégagé.
  const labels = await boxes("loop", "[data-ring-label]");
  const bubbles = await boxes("loop", "[data-loop-bubble]");
  noOverlap(labels, bubbles);
  noOverlap(await boxes("loop", "[data-tour]"), bubbles);
  // Étape 01 : aucun tampon n'est sous une carte testeur posée au-dessus (Awa est devant, puis l'ordre du DOM).
  const testers = await page.locator('[data-static-scene="step1"] [data-tester]').evaluateAll((els) =>
    els.map((el) => {
      const box = (e: Element) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      return { name: el.getAttribute("data-tester"), card: box(el), stamp: box(el.querySelector("[data-tester-stamp]")!) };
    }),
  );
  expect(testers.length).toBeGreaterThan(1);
  testers.forEach((t, i) =>
    testers.forEach((o, j) => {
      const above = o.name === "Awa K." || (t.name !== "Awa K." && j > i);
      if (o !== t && above) expect(overlaps(t.stamp, o.card), `${t.name} / ${o.name}`).toBe(false);
    }),
  );
  // Étape 03 : les pastilles ne couvrent ni le badge du dossier, ni la note du dev, ni l'autre pastille.
  const pills = await boxes("step3", "[data-rating-pill]");
  noOverlap(pills, await boxes("step3", "[data-proof-badge]"));
  noOverlap(pills, await boxes("step3", "[data-avatar-label]"));
  noOverlap(pills, pills);
  // Étape 04 : les deux autocollants posés, sans se recouvrir.
  const stickers = await boxes("step4", "[data-curve-sticker]");
  expect(stickers).toHaveLength(2);
  noOverlap(stickers, stickers);
  noOverlap(stickers, await boxes("step4", "[data-curve-label]"));
  await context.close();
});

// ---------- Sections sous l'histoire (§3.5 à §3.11, Task 7) ----------

test("reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const t of ["Tu connais la boucle", "Et si on cassait la boucle ?", "Des pros de ton métier cible. Vérifiés."])
    await expect(page.getByText(t, { exact: false }).first()).toBeVisible();
  // États finaux figés : écran « Mission validée » du téléphone, tampon HORODATÉ, snippet complet.
  const pro = page.locator("#pro");
  await pro.scrollIntoViewIfNeeded();
  await expect(pro.locator("[data-phone-screen='done']")).toBeVisible();
  await expect(pro.locator("[data-phone-screen='done']")).toContainText("Paiement envoyé");
  await expect(pro.locator("[data-static-missions]")).toBeVisible();
  await expect(page.locator("#confiance [data-cert-stamp]")).toBeVisible();
  await expect(page.locator("#confiance [data-cert-hash]")).toHaveText("9f3a…c21e");
  await expect(page.locator("#entre-devs [data-snippet]")).toContainText('data-app="monapp"');
});

test("no js", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#pro")).toContainText(/métier/i);
  for (const [sel, text] of [
    ["#pro", "Ton métier vaut de l'argent. Ici, il est payé."],
    ["#pro", "Je teste et je suis rémunéré"],
    ["#en-direct", "Chaque chiffre vient d'un vrai test, pas d'un formulaire."],
    ["#comment-ca-marche", "Trois promesses. Deux gagnants."],
    ["#confiance", "Protégé dès le dépôt."],
    ["#entre-devs", "Une ligne de code. Et tu sais qui revient."],
    ["#cta-final", "Arrête de recommencer la boucle."],
    ["footer", "Construit à Abidjan, pour les devs, par les devs"],
  ] as const) {
    await expect(page.locator(sel)).toContainText(text);
  }
  // Sans JS, rien ne reste masqué par un état initial d'animation.
  for (const t of ["Trois promesses. Deux gagnants.", "Protégé dès le dépôt.", "Arrête de recommencer la boucle."])
    await expect(page.getByRole("heading", { name: t })).toBeVisible();
  await expect(page.getByText("Webhooks mobile money en local, vous faites comment ?")).toBeVisible();
  await ctx.close();
});

test("api down", { tag: "@api-down" }, async ({ page }) => {
  await page.route("**/api/public/stats/**", (r) => r.abort());
  // Le polling vise la route Next sans barre finale.
  await page.route("**/api/public/stats", (r) => r.abort());
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("[data-live-counter]")).toHaveCount(0);
  // La section garde son texte, sans chiffre inventé.
  await expect(page.locator("#en-direct")).toContainText("Chaque chiffre vient d'un vrai test, pas d'un formulaire.");
  await expect(page.locator("[data-live-badge]")).toHaveCount(0);
});

test("demo label when demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Données de démo CADEV").first()).toBeVisible();
});

test("live section shows server counters and the demo mention", async ({ page }) => {
  await page.goto("/");
  const live = page.locator("#en-direct");
  await live.scrollIntoViewIfNeeded();
  await expect(live.locator("[data-live-counter]")).toHaveCount(3);
  await expect(live).toContainText("Données de démo CADEV · mises à jour toutes les 15 s");
  await expect(live.locator("[aria-live='polite']")).toHaveCount(1);
});

// Le passage de 0 à la valeur est fixé au niveau unitaire (count-up.test.ts) : la base de démo renvoie des 0
// et l'e2e ne contrôle pas la valeur rendue côté serveur. Ici : valeur finale juste, et rien n'est animé en reduced-motion.
for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`live counters show the server value (reduced motion: ${reducedMotion})`, async ({ browser }, info) => {
    const context = await browser.newContext({ ...info.project.use, reducedMotion });
    const page = await context.newPage();
    await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
    const counters = page.locator("#en-direct [data-live-counter]");
    await counters.first().scrollIntoViewIfNeeded();
    const read = () =>
      counters.evaluateAll((els) =>
        els.map((el) => ({
          // Odomètre : chaque colonne contient 0 à 9, on lit donc la valeur qu'il affiche.
          shown:
            el.querySelector("[data-odometer]")?.getAttribute("data-odometer") ??
            el.querySelector("[aria-hidden='true']")!.textContent!,
          server: el.querySelector(".sr-only")!.textContent!,
        })),
      );
    if (reducedMotion === "reduce") {
      // Tout de suite, sans attendre de comptage.
      for (const c of await read()) expect(c.shown).toBe(c.server);
    }
    await expect.poll(async () => (await read()).every((c) => c.shown === c.server), { timeout: 5000 }).toBe(true);
    await context.close();
  });
}

test("live section polls the public stats through the same origin", async ({ page }) => {
  await page.clock.install();
  const polled: string[] = [];
  // Toute requête compte (même un 503 d'un amont lent) : on vérifie que le navigateur interroge la même origine.
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/public/stats")) polled.push(r.url());
  });
  await page.goto("/");
  // L'intervalle n'existe qu'après l'hydratation : on attend que le polling soit armé avant d'avancer l'horloge.
  await expect(page.locator("#en-direct[data-live-polling]")).toHaveCount(1, { timeout: 20_000 });
  await page.clock.runFor(16_000);
  await expect.poll(() => polled.length).toBeGreaterThan(0);
  expect(new URL(polled[0]).origin).toBe(new URL(page.url()).origin);
});

test("copy button copies the snippet and says so", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const devs = page.locator("#entre-devs");
  await devs.scrollIntoViewIfNeeded();
  await devs.getByRole("button", { name: "Copier" }).click();
  await expect(devs.getByRole("button", { name: "Copié" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '<script src="https://[nom].ci/usage.js" data-app="monapp" defer></script>',
  );
});

test("final CTA links and section anchors", async ({ page }) => {
  await page.goto("/");
  const cta = page.locator("#cta-final");
  await expect(cta.getByRole("link", { name: "Je suis développeur" })).toHaveAttribute("href", "/inscription?role=dev");
  await expect(cta.getByRole("link", { name: "Je teste et je suis rémunéré" })).toHaveAttribute("href", "/inscription?role=tester");
  await expect(page.locator("#pro").getByRole("link", { name: "Je teste et je suis rémunéré" })).toHaveAttribute(
    "href",
    "/inscription?role=tester",
  );
  // Chaque ancre de la nav mène à une section qui existe.
  for (const href of await page.locator("header nav a[href^='#']").evaluateAll((els) => els.map((e) => e.getAttribute("href")!)))
    await expect(page.locator(href)).toHaveCount(1);
  for (const id of ["pro", "en-direct", "comment-ca-marche", "confiance", "entre-devs", "cta-final"])
    await expect(page.locator(`section#${id}`)).toHaveAttribute("aria-labelledby", /.+/);
});

test("final CTA buttons sit above the fold once the section is reached", async ({ page }, info) => {
  test.skip(!["desktop", "wide", "laptop", "laptop-sm"].includes(info.project.name));
  await page.goto("/");
  await page.locator("#cta-final").evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" }));
  await page.waitForTimeout(1600);
  const cta = await page.locator("#cta-final").getByRole("link", { name: "Je suis développeur" }).boundingBox();
  expect(cta!.y + cta!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test("final CTA: one tab stop per button (no focusable wrapper)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#cta-final").scrollIntoViewIfNeeded();
  await expect(page.locator('#cta-final [tabindex="0"]')).toHaveCount(0);
});

test("lower sections never scroll sideways", async ({ page }) => {
  await page.goto("/");
  const width = page.viewportSize()!.width;
  for (const id of ["pro", "en-direct", "comment-ca-marche", "confiance", "entre-devs", "cta-final"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), id).toBe(true);
    expect(await page.evaluate(() => window.innerWidth), `${id} : fenêtre de mise en page élargie`).toBe(width);
  }
});
