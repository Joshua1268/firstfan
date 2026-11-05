import type { AdoptionRow } from "./types";

export const WINDOWS = [
  { key: "d1", label: "J1" },
  { key: "d7", label: "J7" },
  { key: "d30", label: "J30" },
] as const;

export type AdoptionWindow = (typeof WINDOWS)[number];

// Only testers whose window has started count: "2 sur 3 reviennent à J7".
export function windowSummary(rows: AdoptionRow[], { key, label }: AdoptionWindow): string {
  const measured = rows.filter((row) => row[key] !== null);
  if (measured.length === 0) return `${label} : pas encore mesuré`;
  const returned = measured.filter((row) => row[key]).length;
  const verb = returned > 1 ? "reviennent" : "revient";
  return `${returned} sur ${measured.length} ${verb} à ${label}`;
}
