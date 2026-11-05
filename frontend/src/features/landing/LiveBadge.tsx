import type { HeroBadge } from "@/lib/hero-badge";

// The value comes from the server, so no zero flashes during hydration.
export function LiveBadge({
  badge,
  demo,
  className = "",
}: {
  badge: HeroBadge | null;
  demo: boolean;
  className?: string;
}) {
  if (badge === null) return null;
  return (
    <div data-live-badge className={`flex flex-col items-center gap-1.5 whitespace-nowrap md:items-start ${className}`}>
      <p className="inline-flex items-center gap-2.5 font-mono text-[12px] leading-none text-ink-muted">
        <span aria-hidden="true" className="live-dot" />
        <span>
          <span className="tabular-nums">{badge.value}</span> {badge.label}
        </span>
      </p>
      {demo && (
        <p className="font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-ink-muted">Données de démo</p>
      )}
    </div>
  );
}
