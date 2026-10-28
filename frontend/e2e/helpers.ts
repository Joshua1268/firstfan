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
export async function scrollStageTo(page: import("@playwright/test").Page, p: number) {
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
export async function waitForLiveStage(page: import("@playwright/test").Page) {
  await page.locator("[data-stage-loaded]").waitFor({ state: "attached", timeout: 15_000 });
}
