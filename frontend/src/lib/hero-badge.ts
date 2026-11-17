import type { PublicStats } from "./stats";

export type HeroBadge = { value: number; label: string };

// Never a made-up or zero number.
export function heroBadge(stats: PublicStats | null): HeroBadge | null {
  if (!stats) return null;
  const n = stats.tests_in_progress;
  if (n > 0) return { value: n, label: n > 1 ? "tests en cours" : "test en cours" };
  const v = stats.verified_testers;
  if (v > 0) return { value: v, label: v > 1 ? "testeurs vérifiés" : "testeur vérifié" };
  return null;
}
