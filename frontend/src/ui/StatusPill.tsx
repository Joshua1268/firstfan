import type { ReactNode } from "react";

const TONES = {
  waiting: "border-ink/30 text-ink",
  success: "border-accent/60 text-accent",
  danger: "border-danger/60 text-danger",
};

export function StatusPill({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-pill border px-3.5 font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] ${TONES[tone]}`}
    >
      <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
