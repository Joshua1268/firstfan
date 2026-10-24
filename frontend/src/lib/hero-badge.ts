import type { PublicStats } from "./stats";

export type HeroBadge = { value: number; label: string };

/**
 * Chiffre du badge du hero, toujours réel (jamais inventé) :
 * - les tests en cours s'il y en a ;
 * - sinon les testeurs vérifiés (les campagnes n'existent pas encore, un « 0 » qui pulse ne dit rien) ;
 * - sinon rien : le badge est masqué (base vide ou API injoignable).
 */
export function heroBadge(stats: PublicStats | null): HeroBadge | null {
  if (!stats) return null;
  const n = stats.tests_in_progress;
  if (n > 0) return { value: n, label: n > 1 ? "tests en cours" : "test en cours" };
  const v = stats.verified_testers;
  if (v > 0) return { value: v, label: v > 1 ? "testeurs vérifiés" : "testeur vérifié" };
  return null;
}
