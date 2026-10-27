import type { PublicStats } from "./stats";

export type CounterKey = "tests_in_progress" | "verified_testers" | "apps_tested";

export type LiveCounter = { key: CounterKey; value: number; label: string };

const COUNTERS: { key: CounterKey; one: string; many: string }[] = [
  { key: "tests_in_progress", one: "test en cours", many: "tests en cours" },
  { key: "verified_testers", one: "testeur vérifié", many: "testeurs vérifiés" },
  { key: "apps_tested", one: "app testée", many: "apps testées" },
];

/**
 * Compteurs de la section « En direct », avec la même règle honnête que le badge du hero (`hero-badge.ts`) :
 * - jamais de « 0 » affiché : un compteur à zéro est retiré ;
 * - aucun compteur (liste vide) si tout vaut zéro ou si l'API n'a pas répondu ;
 * - les valeurs sont celles de l'API, telles quelles (jamais arrondies ni inventées).
 * L'ordre reste celui de la spec (tests en cours, testeurs vérifiés, apps testées).
 */
export function liveCounters(stats: PublicStats | null): LiveCounter[] {
  if (!stats) return [];
  return COUNTERS.flatMap((c) => {
    const value = stats[c.key];
    if (!Number.isFinite(value) || value <= 0) return [];
    return [{ key: c.key, value, label: value > 1 ? c.many : c.one }];
  });
}

/** Résumé lu par les lecteurs d'écran (une fois par minute au plus) ; vide si aucun compteur. */
export function liveSummary(counters: LiveCounter[]): string {
  return counters.length ? counters.map((c) => `${c.value} ${c.label}`).join(", ") + "." : "";
}
