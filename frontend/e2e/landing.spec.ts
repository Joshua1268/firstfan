import { expect, test } from "@playwright/test";
import { overlaps, scan } from "./helpers";

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
  const ctas = page.locator("[data-hero-cta]");
  await expect(ctas.first()).toHaveAttribute("data-camp", "pro");
});

test("rendered page has no forbidden content", async ({ page }) => {
  await page.goto("/");
  expect(await scan(await page.locator("body").innerText())).toEqual([]);
});

test("stickers: 8 on desktop, 5 on mobile, never over the hero text or the CTAs", async ({ page }, info) => {
  await page.goto("/");
  const stickers = page.locator("[data-sticker]");
  await expect(stickers).toHaveCount(info.project.name === "mobile" ? 5 : 8);
  await page.waitForTimeout(1600);
  const guarded = await page.locator("[data-hero-guard], [data-hero-cta]").evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0).map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
  );
  expect(guarded.length).toBeGreaterThan(8);
  for (const s of await stickers.all()) {
    const box = await s.boundingBox();
    expect(box).not.toBeNull();
    for (const g of guarded) expect(overlaps(box, g), `${await s.innerText()} overlaps ${JSON.stringify(g)}`).toBe(false);
  }
});

test("live badge shows the server value without JS", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("[data-live-badge]")).toContainText(/\d+ tests? en cours/);
  await context.close();
});
