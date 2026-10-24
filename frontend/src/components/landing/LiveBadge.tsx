/**
 * Badge « [n] tests en cours » (§2, §3.2).
 * La valeur vient du serveur : jamais de 0 qui clignote à l'hydratation.
 * Le point pulse en CSS à partir de 1300 ms (classe `live-dot`, figée en reduced-motion).
 */
export function LiveBadge({ value, demo, className = "" }: { value: number | null; demo: boolean; className?: string }) {
  if (value === null) return null;
  return (
    <div data-live-badge className={`flex flex-col items-center gap-1.5 whitespace-nowrap md:items-start ${className}`}>
      <p className="inline-flex items-center gap-2.5 font-mono text-[13px] leading-none text-ink">
        <span aria-hidden="true" className="live-dot" />
        <span>
          <span className="tabular-nums">{value}</span> {value > 1 ? "tests en cours" : "test en cours"}
        </span>
      </p>
      {demo && <p className="font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-ink-muted">Données de démo CADEV</p>}
    </div>
  );
}
