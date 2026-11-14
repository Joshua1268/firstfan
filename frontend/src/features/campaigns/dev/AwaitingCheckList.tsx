import { ClockIcon } from "@/ui/icons";
import type { AwaitingCheck } from "../types";

// Applicants whose piece the team has not checked yet: shown, but not selectable.
export function AwaitingCheckList({ testers }: { testers: AwaitingCheck[] }) {
  if (testers.length === 0) return null;
  return (
    <section aria-labelledby="awaiting-title" className="flex flex-col gap-3">
      <h3 id="awaiting-title" className="text-[17px] font-semibold text-ink">
        Candidats en cours de vérification
      </h3>
      <p className="max-w-[60ch] text-[14px] leading-[1.5] text-ink-muted">
        Ils ont postulé et envoyé une pièce. Tu pourras les choisir dès que l&apos;équipe l&apos;aura validée.
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {testers.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line p-4 text-[15px]"
          >
            <ClockIcon size={18} className="shrink-0 text-ink-muted" />
            <span className="min-w-0 flex-1 font-medium text-ink [overflow-wrap:anywhere]">
              {[t.first_name, t.last_initial && `${t.last_initial}.`].filter(Boolean).join(" ")}
              {t.city && <span className="font-normal text-ink-muted"> · {t.city}</span>}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
              Vérification en cours
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
