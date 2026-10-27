type Box = { x: number; y: number; width: number; height: number } | null;

export type Finding = { rule: string; match: string; index: number };

/**
 * Garde-fous de contenu partagés avec `scripts/check-content.mjs`.
 * Import dynamique : Playwright transpile les specs en CommonJS, alors que le script est un module ES.
 */
export async function scan(text: string): Promise<Finding[]> {
  const mod = (await import("../scripts/check-content.mjs")) as { scan: (t: string) => Finding[] };
  return mod.scan(text);
}

/** Vrai si les deux boîtes se recouvrent (un contact bord à bord ne compte pas). */
export function overlaps(a: Box, b: Box): boolean {
  if (!a || !b) return false;
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * Fait défiler la page pour que la progression brute du stage vaille `p` (offset « start start » / « end end »).
 * Défilement instantané : le `p` lissé (spring 200/40) rattrape ensuite la valeur.
 */
export async function scrollStageTo(page: import("@playwright/test").Page, p: number) {
  await waitForLiveStage(page);
  await page.evaluate((target) => {
    const stage = document.querySelector<HTMLElement>("[data-stage]");
    if (!stage) throw new Error("stage introuvable");
    const top = stage.getBoundingClientRect().top + window.scrollY;
    const range = stage.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + target * range, behavior: "instant" });
  }, p);
}

/**
 * Le module du stage animé est chargé après l'hydratation (inactivité ou approche du viewport). Avant, le HTML
 * serveur est affiché mais pas interactif : les tests qui pilotent le stage attendent son chargement.
 * À n'utiliser qu'avec le stage animé : en reduced-motion (ou repli statique), le chunk n'est jamais chargé.
 */
export async function waitForLiveStage(page: import("@playwright/test").Page) {
  await page.locator("[data-stage-loaded]").waitFor({ state: "attached", timeout: 15_000 });
}
