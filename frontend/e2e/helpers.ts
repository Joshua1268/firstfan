import { expect, type Page } from "@playwright/test";

type Box = { x: number; y: number; width: number; height: number } | null;

export type Finding = { rule: string; match: string; index: number };

// Dynamic import: Playwright compiles specs to CommonJS, the script is an ES module.
export async function scan(text: string): Promise<Finding[]> {
  const mod = (await import("../scripts/check-content.mjs")) as { scan: (t: string) => Finding[] };
  return mod.scan(text);
}

// Touching edges do not count as an overlap.
export function overlaps(a: Box, b: Box): boolean {
  if (!a || !b) return false;
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

// Scrolls so the raw stage progress equals p; the smoothed progress catches up afterwards.
export async function scrollStageTo(page: Page, p: number) {
  await waitForLiveStage(page);
  await page.evaluate((target) => {
    const stage = document.querySelector<HTMLElement>("[data-stage]");
    if (!stage) throw new Error("stage not found");
    const top = stage.getBoundingClientRect().top + window.scrollY;
    const range = stage.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + target * range, behavior: "instant" });
  }, p);
}

// The animated stage loads after hydration; never use this with reduced motion, where it never loads.
export async function waitForLiveStage(page: Page) {
  await page.locator("[data-stage-loaded]").waitFor({ state: "attached", timeout: 15_000 });
}

export const PASSWORD = "Sol1de-pass!";

export function uniqueEmail(prefix: string, testInfo: { project: { name: string } }) {
  return `${prefix}-${testInfo.project.name}-${Date.now()}@e2e.test`;
}

export async function signUpDev(page: Page, email: string) {
  await page.goto("/inscription?role=dev");
  await page.getByLabel("Prénom").fill("Awa");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/dev$/);
}

// Smallest valid PNG (1 x 1 pixel): the API checks the first bytes of every capture.
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
