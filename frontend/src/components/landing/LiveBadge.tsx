import type { HeroBadge } from "@/lib/hero-badge";

/**
 * Badge en direct du hero (§2, §3.2) : « [n] tests en cours », ou « [n] testeurs vérifiés » tant qu'aucun test ne
 * tourne (voir heroBadge). La valeur vient du serveur : jamais de 0 qui clignote à l'hydratation, et pas de badge
 * du tout quand il n'y a rien de réel à montrer.
 * Le point pulse en CSS à partir de 1300 ms (classe `live-dot`, figée en reduced-motion).
 */
export function LiveBadge({ badge, demo, className = "" }: { badge: HeroBadge | null; demo: boolean; className?: string }) {
  if (badge === null) return null;
  return (
    <div data-live-badge className={`flex flex-col items-center gap-1.5 whitespace-nowrap md:items-start ${className}`}>
      <p className="inline-flex items-center gap-2.5 font-mono text-[13px] leading-none text-ink">
        <span aria-hidden="true" className="live-dot" />
        <span>
          <span className="tabular-nums">{badge.value}</span> {badge.label}
        </span>
      </p>
      {demo && <p className="font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-ink-muted">Données de démo CADEV</p>}
    </div>
  );
}
