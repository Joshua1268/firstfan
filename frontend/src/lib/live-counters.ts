import type { PublicStats } from "./stats";

export type CounterKey = "tests_in_progress" | "verified_testers" | "apps_tested";

export type LiveCounter = { key: CounterKey; value: number; label: string };

const COUNTERS: { key: CounterKey; one: string; many: string }[] = [
  { key: "tests_in_progress", one: "test en cours", many: "tests en cours" },
  { key: "verified_testers", one: "testeur vérifié", many: "testeurs vérifiés" },
  { key: "apps_tested", one: "app testée", many: "apps testées" },
];

// Zero counters are dropped, so nothing shows when the API is empty or down.
export function liveCounters(stats: PublicStats | null): LiveCounter[] {
  if (!stats) return [];
  return COUNTERS.flatMap((c) => {
    const value = stats[c.key];
    if (!Number.isFinite(value) || value <= 0) return [];
    return [{ key: c.key, value, label: value > 1 ? c.many : c.one }];
  });
}

// Screen reader summary.
export function liveSummary(counters: LiveCounter[]): string {
  return counters.length ? counters.map((c) => `${c.value} ${c.label}`).join(", ") + "." : "";
}
