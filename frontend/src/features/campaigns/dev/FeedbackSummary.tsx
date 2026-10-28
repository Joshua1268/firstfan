import { StarIcon } from "@/ui/icons";
import { WOULD_PAY_LABEL } from "../status";
import type { Feedback } from "../types";

// What the tester said once all steps were done.
export function FeedbackSummary({ feedback }: { feedback: Feedback }) {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-label)] border border-line p-4">
      <h4 className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
        Avis du testeur
      </h4>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px]">
        <dt className="text-ink-muted">Utilité</dt>
        <dd className="inline-flex items-center gap-1 text-ink">
          <StarIcon size={16} fill="currentColor" className="text-accent" />
          {feedback.usefulness} sur 5
        </dd>
        <dt className="text-ink-muted">Paierait</dt>
        <dd className="text-ink">{WOULD_PAY_LABEL[feedback.would_pay]}</dd>
        {feedback.blockers && (
          <>
            <dt className="text-ink-muted">Bloquant</dt>
            <dd className="text-ink [overflow-wrap:anywhere]">{feedback.blockers}</dd>
          </>
        )}
        {feedback.comment && (
          <>
            <dt className="text-ink-muted">Avis</dt>
            <dd className="text-ink [overflow-wrap:anywhere]">{feedback.comment}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
