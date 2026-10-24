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
