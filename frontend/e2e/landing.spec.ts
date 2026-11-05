import type { Page } from "@playwright/test";
import { expect, pinCores, test } from "./fixtures";
import { overlaps, scan, scrollStageTo, waitForLiveStage } from "./helpers";

// Visible boxes that no sticker may cover.
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
  // One DOM read for all stickers.
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

test("hero copy is server-rendered and its single CTA is clickable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tes futurs clients testent ton app\./i);
  const hero = page.locator("#hero");
  await expect(hero.getByRole("link", { name: "Je suis développeur" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Je suis développeur" })).toHaveAttribute(
    "href",
    "/inscription?role=dev",
  );
  // Testers have their own page, so no tester CTA in the hero.
  await expect(hero.getByRole("link", { name: "Je teste et je suis rémunéré" })).toHaveCount(0);
  await expect(hero.locator("a[href*='role=tester']")).toHaveCount(0);
});

test("states what the service does right after the hero", async ({ page }) => {
  await page.goto("/");
  const purpose = page.locator("section#ce-que-fait");
  await expect(purpose).toHaveAttribute("aria-labelledby", "purpose-title");
  await expect(purpose).toContainText("met en relation des développeurs qui ont une application à faire tester");
  await expect(purpose).toContainText("La connexion avec Google sert uniquement à t'identifier");
  expect(await page.evaluate(() => document.querySelector("#hero")?.nextElementSibling?.id)).toBe("ce-que-fait");
  for (const [name, href] of [
    ["Confidentialité", "/confidentialite"],
    ["Conditions d'utilisation", "/conditions"],
  ] as const)
    await expect(page.locator("footer").getByRole("link", { name })).toHaveAttribute("href", href);
});

test("mobile layout", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/");
  await page.waitForTimeout(1600);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Mobile Chrome widens the layout viewport when something overflows, which innerWidth reveals.
  expect(await page.evaluate(() => window.innerWidth)).toBe(375);
  const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
  for (const s of await page.locator("[data-sticker]").all()) expect(overlaps(await s.boundingBox(), h1)).toBe(false);
  const ctas = page.locator("[data-hero-cta]:visible");
  await expect(ctas).toHaveCount(1);
  await expect(ctas.first()).toHaveAttribute("data-camp", "dev");
  // Mobile stickers sit below the CTA, never before the H1 in reading order.
  const cta = (await ctas.first().boundingBox())!;
  for (const s of await page.locator("[data-sticker]").all())
    expect((await s.boundingBox())!.y).toBeGreaterThan(cta.y + cta.height);
});

test("hero reads in three levels: H1, then one sentence, then one button", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#hero");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1100); // end of the CSS entrance
  await expect(hero.locator("[data-hero-cta]:visible")).toHaveCount(1);
  const [h1, lead, cta] = await Promise.all([
    hero.getByRole("heading", { level: 1 }).boundingBox(),
    hero.getByText("Des pros vérifiés du métier que tu vises").boundingBox(),
    hero.getByRole("link", { name: "Je suis développeur" }).boundingBox(),
  ]);
  expect(h1!.y + h1!.height).toBeLessThanOrEqual(lead!.y);
  expect(lead!.y + lead!.height).toBeLessThanOrEqual(cta!.y);
  // The sentence fits in a few lines.
  const lines = await hero.getByText("Des pros vérifiés du métier que tu vises").evaluate((el) => {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    return Math.round(el.getBoundingClientRect().height / lh);
  });
  expect(lines).toBeLessThanOrEqual(page.viewportSize()!.width >= 1280 ? 2 : page.viewportSize()!.width >= 768 ? 3 : 4);
  // The button is above the fold.
  expect(cta!.y + cta!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test("rendered page has no forbidden content", async ({ page }) => {
  await page.goto("/");
  expect(await scan(await page.locator("body").innerText())).toEqual([]);
});

test("stickers never cover the hero text or the CTAs, and the page never scrolls sideways", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator("[data-sticker]")).toHaveCount(smallScreen(info.project.name) ? 2 : 3);
  // One lime sticker on desktop, none on mobile.
  await expect(page.locator("[data-sticker][data-accent='true']")).toHaveCount(smallScreen(info.project.name) ? 0 : 1);
  await page.waitForTimeout(1600);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Mobile Chrome widens the layout viewport when something overflows, which innerWidth reveals.
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
  await page.locator("#hero").getByRole("link", { name: "Je suis développeur" }).hover();
  await page.waitForTimeout(900);
  await expectNoStickerOverlap(page);
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
  await expect(page.locator("[data-live-badge]")).toContainText(/[1-9]\d* (tests? en cours|testeurs? vérifiés?)/);
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
  // 5 menu links plus the close button: 6 tabs come back to the first link.
  await expect(page.locator("[data-mobile-menu] a[href]")).toHaveCount(5);
  await expect(page.locator("[data-mobile-menu]").getByRole("link", { name: "Pour les testeurs" })).toHaveAttribute(
    "href",
    "/testeurs",
  );
  for (let i = 0; i < 6; i++) {
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
    // Zero-height inline-block probe on the FUTURS baseline.
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    futurs.appendChild(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();
    const f = futurs.getBoundingClientRect();
    const c = clients.getBoundingClientRect();
    const check = document.querySelector("#hero-title path")!.getBoundingClientRect();
    return {
      baseline,
      futurs: { left: f.left, right: f.right },
      clients: { left: c.left, right: c.right, top: c.top },
      check: { left: check.left, right: check.right, top: check.top, bottom: check.bottom },
    };
  });
  // Below the FUTURS baseline, with room for the round stroke.
  expect(geo.check.top).toBeGreaterThanOrEqual(geo.baseline + 2);
  // Above CLIENTS: centered in the word, bottom at the top of the letters.
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
  // The doubled content is decorative: screen readers read the list once.
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
  // All 14 jobs fit in the viewport without overflow.
  const pills = page.locator("[data-marquee-track] [data-pill][data-copy='0']");
  await expect(pills).toHaveCount(14);
  const vw = page.viewportSize()!.width;
  const boxes = await pills.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect()).map((r) => ({ l: r.left, r: r.right })),
  );
  for (const b of boxes) {
    expect(b.l).toBeGreaterThanOrEqual(0);
    expect(b.r).toBeLessThanOrEqual(vw);
  }
  for (const sel of ["[data-marquee-track] .marquee-list", ".marquee-band"]) {
    const m = await page
      .locator(sel)
      .first()
      .evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
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
  // The stamp goes away after 1200ms.
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

// Blocks the live stage chunk and returns the stage chunks requested.
async function blockStageChunk(page: import("@playwright/test").Page) {
  const hits: string[] = [];
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    if (body.includes("data-loop-bubble")) {
      hits.push(route.request().url());
      return route.abort();
    }
    return route.fulfill({ response: res, body });
  });
  return hits;
}

test("before the live stage loads, step links are real anchors that work", async ({ page }, info) => {
  test.skip(info.project.name === "api-down");
  const hits = await blockStageChunk(page);
  await page.goto("/");
  await page.locator("#boucle").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  expect(hits.length).toBeGreaterThan(0);
  await expect(page.locator("[data-stage-loaded]")).toHaveCount(0);
  // Steps are links to a stage target, not inert buttons.
  await expect(page.locator(".stage-live nav button")).toHaveCount(0);
  const step2 = page.locator(".stage-live nav a[aria-label='Étape 02']").first();
  const href = (await step2.getAttribute("href"))!;
  await expect(page.locator(href)).toHaveCount(1);
  await step2.click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(href);
  const inStage = await page.evaluate((h) => {
    const t = document.querySelector(h)!.getBoundingClientRect().top;
    return Math.abs(t) < 4;
  }, href);
  expect(inStage).toBe(true);
});

test("reduced motion never requests the live stage chunk", async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use, reducedMotion: "reduce" });
  const page = await context.newPage();
  const hits = await blockStageChunk(page);
  await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
  await page.locator("#boucle").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  expect(hits).toEqual([]);
  await expect(page.locator("[data-static-scene]").first()).toBeVisible();
  await context.close();
});

test("a low-end device (fewer than 4 cores) never requests the live stage chunk", async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use });
  await context.addInitScript(pinCores(2));
  const page = await context.newPage();
  const hits = await blockStageChunk(page);
  await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
  await page.locator("#boucle").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  expect(hits).toEqual([]);
  await expect(page.locator("#boucle[data-stage-fallback]")).toHaveCount(1);
  await expect(page.locator("[data-stage-loaded]")).toHaveCount(0);
  await context.close();
});

test("stage jump back", async ({ page }) => {
  await page.goto("/");
  await waitForLiveStage(page);
  await scrollStageTo(page, 0.92);
  await page.locator("[data-stage]").getByRole("link", { name: "Boucle", exact: true }).click();
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
      return {
        dash: parseFloat(getComputedStyle(arc).strokeDashoffset),
        color: parseFloat(getComputedStyle(color).opacity),
      };
    });
  await scrollStageTo(page, 0.3);
  await expect(stage).toHaveAttribute("data-scene", "voices");
  // After the break: shorter arcs, card in color.
  await expect.poll(async () => (await read()).dash).toBeGreaterThan(5);
  await expect.poll(async () => (await read()).color).toBeGreaterThan(0.95);
  await scrollStageTo(page, 0.1);
  await expect(stage).toHaveAttribute("data-scene", "loop");
  // Below 0.185: arcs close and the card turns grey again.
  await expect.poll(async () => (await read()).dash, { timeout: 8000 }).toBeLessThan(0.5);
  await expect.poll(async () => (await read()).color, { timeout: 8000 }).toBeLessThan(0.05);
});

test("stage scene text for steps 01 to 04 is in the HTML without JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
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

test("live stage scene A: a ring label never covers a visible bubble", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-stage]")).toBeAttached();
  for (const p of [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14]) {
    await scrollStageTo(page, p);
    await page.waitForTimeout(900);
    const hits = await page.evaluate(() => {
      const shown = (el: Element) => {
        let o = 1;
        for (let a: Element | null = el; a; a = a.parentElement) o *= Number(getComputedStyle(a).opacity);
        return o;
      };
      const labels = [...document.querySelectorAll("[data-stage] [data-ring-label]")].map((e) =>
        e.getBoundingClientRect(),
      );
      const out: string[] = [];
      for (const b of document.querySelectorAll("[data-stage] [data-loop-bubble]")) {
        if (shown(b) < 0.3) continue;
        const r = b.getBoundingClientRect();
        for (const l of labels)
          if (r.left < l.right && l.left < r.right && r.top < l.bottom && l.top < r.bottom)
            out.push(b.textContent ?? "");
      }
      return out;
    });
    expect(hits, `p=${p}`).toEqual([]);
  }
});

test("server HTML has a single heading per stage scene", async ({ request }) => {
  const html = await (await request.get("/")).text();
  for (const title of [
    "Et si on cassait la boucle",
    "Des pros de ton métier cible. Vérifiés.",
    "Pas des likes. Des gens qui reviennent.",
  ]) {
    const count = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].filter((m) =>
      m[1].replace(/<[^>]+>/g, "").includes(title),
    ).length;
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
  // The transcript mounts after hydration.
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
    for (const x of a)
      for (const y of b) if (x !== y) expect(overlaps(x.box, y.box), `${x.text} / ${y.text}`).toBe(false);
  };
  // Loop: labels readable, turn counter clear.
  const labels = await boxes("loop", "[data-ring-label]");
  const bubbles = await boxes("loop", "[data-loop-bubble]");
  noOverlap(labels, bubbles);
  noOverlap(await boxes("loop", "[data-tour]"), bubbles);
  // Step 01: no stamp sits under a tester card above it.
  const testers = await page.locator('[data-static-scene="step1"] [data-tester]').evaluateAll((els) =>
    els.map((el) => {
      const box = (e: Element) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      return {
        name: el.getAttribute("data-tester"),
        card: box(el),
        stamp: box(el.querySelector("[data-tester-stamp]")!),
      };
    }),
  );
  expect(testers.length).toBeGreaterThan(1);
  testers.forEach((t, i) =>
    testers.forEach((o, j) => {
      const above = o.name === "Awa K." || (t.name !== "Awa K." && j > i);
      if (o !== t && above) expect(overlaps(t.stamp, o.card), `${t.name} / ${o.name}`).toBe(false);
    }),
  );
  // Step 03: chips cover neither the proof badge, the dev rating nor each other.
  const pills = await boxes("step3", "[data-rating-pill]");
  noOverlap(pills, await boxes("step3", "[data-proof-badge]"));
  noOverlap(pills, await boxes("step3", "[data-avatar-label]"));
  noOverlap(pills, pills);
  // Step 04: both stickers placed without overlapping.
  const stickers = await boxes("step4", "[data-curve-sticker]");
  expect(stickers).toHaveLength(2);
  noOverlap(stickers, stickers);
  noOverlap(stickers, await boxes("step4", "[data-curve-label]"));
  await context.close();
});

// ---------- Sections below the stage ----------

test("reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const t of ["Tu connais la boucle", "Et si on cassait la boucle ?", "Des pros de ton métier cible. Vérifiés."])
    await expect(page.getByText(t, { exact: false }).first()).toBeVisible();
  // Final states: approved mission screen, stamp, full snippet.
  const pro = page.locator("#pro");
  await pro.scrollIntoViewIfNeeded();
  await expect(pro.locator("[data-phone-screen='done']")).toBeVisible();
  await expect(pro.locator("[data-phone-screen='done']")).toContainText("Paiement envoyé");
  await expect(pro.locator("[data-static-missions]")).toBeVisible();
  await expect(page.locator("#confiance [data-cert-stamp]")).toBeVisible();
  await expect(page.locator("#confiance [data-cert-hash]")).toHaveText("9f3a…c21e");
  await expect(page.locator("#entre-devs [data-snippet]")).toContainText('data-app="monapp"');
});

test("no js", async ({ browser }, info) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(info.project.use.baseURL ?? "http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#pro")).toContainText(/métier/i);
  for (const [sel, text] of [
    ["#ce-que-fait", "met en relation des développeurs"],
    ["#pro", "Ton métier vaut de l'argent. Ici, il est payé."],
    ["#pro", "Devenir testeur"],
    ["#en-direct", "Chaque chiffre vient d'un vrai test, pas d'un formulaire."],
    ["#comment-ca-marche", "Trois promesses. Deux gagnants."],
    ["#confiance", "Protégé dès le dépôt."],
    ["#entre-devs", "Une ligne de code. Et tu sais qui revient."],
    ["#cta-final", "Arrête de recommencer la boucle."],
    ["footer", "Construit à Abidjan, pour les devs, par les devs"],
  ] as const) {
    await expect(page.locator(sel)).toContainText(text);
  }
  // Without JS, nothing stays hidden by an initial animation state.
  for (const t of ["Trois promesses. Deux gagnants.", "Protégé dès le dépôt.", "Arrête de recommencer la boucle."])
    await expect(page.getByRole("heading", { name: t })).toBeVisible();
  await expect(page.getByText("Webhooks mobile money en local, vous faites comment ?")).toBeVisible();
  await ctx.close();
});

test("api down", { tag: "@api-down" }, async ({ page }) => {
  await page.route("**/api/public/stats/**", (r) => r.abort());
  // Polling uses the Next route without a trailing slash.
  await page.route("**/api/public/stats", (r) => r.abort());
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("[data-live-counter]")).toHaveCount(0);
  // The section keeps its text, with no made-up number.
  await expect(page.locator("#en-direct")).toContainText("Chaque chiffre vient d'un vrai test, pas d'un formulaire.");
  await expect(page.locator("[data-live-badge]")).toHaveCount(0);
});

test("demo label when demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Données de démo CADEV").first()).toBeVisible();
});

test("live section shows only the non-zero server counters and the demo mention", async ({ page, request }) => {
  const stats = (await (await request.get("http://127.0.0.1:8010/api/public/stats/")).json()) as Record<string, number>;
  const nonZero = ["tests_in_progress", "verified_testers", "apps_tested"].filter((k) => stats[k] > 0).length;
  await page.goto("/");
  const live = page.locator("#en-direct");
  await live.scrollIntoViewIfNeeded();
  await expect(live.locator("[data-live-counter]")).toHaveCount(nonZero);
  // Never shows a zero.
  for (const v of await live.locator("[data-live-counter] .sr-only").allTextContents())
    expect(Number(v)).toBeGreaterThan(0);
  await expect(live).not.toContainText(/(?<!\d)0 (tests? en cours|apps? testées?)/);
  await expect(live).toContainText("Données de démo CADEV · mises à jour toutes les 15 s");
  await expect(live.locator("[aria-live='polite']")).toHaveCount(1);
});

// Count-up and counter selection have unit tests; here, only the final value and no animation with reduced motion.
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
          // Each odometer column holds 0 to 9, so read the displayed value.
          shown:
            el.querySelector("[data-odometer]")?.getAttribute("data-odometer") ??
            el.querySelector("[aria-hidden='true']")!.textContent!,
          server: el.querySelector(".sr-only")!.textContent!,
        })),
      );
    if (reducedMotion === "reduce") {
      // Right away, without counting.
      for (const c of await read()) expect(c.shown).toBe(c.server);
    }
    await expect.poll(async () => (await read()).every((c) => c.shown === c.server), { timeout: 5000 }).toBe(true);
    await context.close();
  });
}

test("live section polls the public stats through the same origin", async ({ page }) => {
  await page.clock.install();
  const polled: string[] = [];
  // Any request counts, even a 503: we check the browser calls the same origin.
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/public/stats")) polled.push(r.url());
  });
  await page.goto("/");
  // Wait for polling to start (after hydration) before moving the clock.
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
  // Testers are sent to /testeurs.
  await expect(cta.getByRole("link", { name: "Je teste et je suis rémunéré" })).toHaveAttribute("href", "/testeurs");
  await expect(page.locator("#pro").getByRole("link", { name: "Devenir testeur" })).toHaveAttribute(
    "href",
    "/testeurs",
  );
  await expect(page.locator("footer").getByRole("link", { name: "Devenir testeur" })).toHaveAttribute(
    "href",
    "/testeurs",
  );
  await expect(page.locator("header nav a[href='/testeurs']").first()).toHaveText("Pour les testeurs");
  // The dev CTA comes before the tester CTA at every size.
  const [dev, pro] = await Promise.all([
    cta.getByRole("link", { name: "Je suis développeur" }).boundingBox(),
    cta.getByRole("link", { name: "Je teste et je suis rémunéré" }).boundingBox(),
  ]);
  expect(dev!.x < pro!.x || dev!.y + dev!.height <= pro!.y).toBe(true);
  // Every nav anchor leads to an existing section.
  for (const href of await page
    .locator("header nav a[href^='#']")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")!)))
    await expect(page.locator(href)).toHaveCount(1);
  for (const id of ["pro", "en-direct", "comment-ca-marche", "confiance", "entre-devs", "cta-final"])
    await expect(page.locator(`section#${id}`)).toHaveAttribute("aria-labelledby", /.+/);
});

test("final CTA buttons sit above the fold once the section is reached", async ({ page }, info) => {
  test.skip(!["desktop", "wide", "laptop", "laptop-sm"].includes(info.project.name));
  await page.goto("/");
  await page
    .locator("#cta-final")
    .evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" }));
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
