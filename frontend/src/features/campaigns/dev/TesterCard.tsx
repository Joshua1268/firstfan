import { useId } from "react";
import { CheckIcon, SparkIcon, StarIcon } from "@/ui/icons";
import type { TesterCandidate } from "../types";

const rating = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// The real checkbox is invisible and covers the whole card, so the tap target is the card.
// Its bottom scroll margin keeps a focused card clear of the sticky pay bar.
export function TesterCard({
  tester,
  checked,
  disabled,
  onToggle,
}: {
  tester: TesterCandidate;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  const name = [tester.first_name, tester.last_initial && `${tester.last_initial}.`].filter(Boolean).join(" ");
  const tests = tester.completed_tests;

  return (
    <label
      className={`relative flex h-full gap-4 rounded-[var(--radius-card)] border p-5 transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
        checked ? "border-accent bg-accent/[0.06]" : "border-line bg-surface/60 hover:border-ink/40"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        aria-labelledby={`${id}-name`}
        aria-describedby={`${id}-details`}
        className="absolute inset-0 size-full scroll-mb-60 cursor-pointer appearance-none rounded-[var(--radius-card)] focus:outline-none disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 ${
          checked ? "border-accent bg-accent text-accent-ink" : "border-ink/40"
        }`}
      >
        {checked && <CheckIcon size={16} strokeWidth={2.5} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span id={`${id}-name`} className="text-[17px] font-semibold text-ink [overflow-wrap:anywhere]">
            {name}
          </span>
          {tester.recommended && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[var(--tracking-kicker)] text-accent">
              <SparkIcon size={14} />
              Recommandé
            </span>
          )}
        </span>
        <span id={`${id}-details`} className="flex flex-col gap-2">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-muted">
            {tester.city && <span>{tester.city}</span>}
            <span className="inline-flex items-center gap-1">
              <StarIcon size={14} className={tester.rating_avg === null ? "" : "text-accent"} />
              {tester.rating_avg === null ? "Pas encore noté" : `${rating.format(tester.rating_avg)} sur 5`}
            </span>
            <span>
              {tests} test{tests > 1 ? "s" : ""} validé{tests > 1 ? "s" : ""}
            </span>
          </span>
          {tester.reason && <span className="text-[14px] leading-[1.5] text-ink-muted">{tester.reason}</span>}
        </span>
      </span>
    </label>
  );
}
