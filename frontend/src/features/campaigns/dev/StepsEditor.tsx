import { useEffect, useId, useRef } from "react";
import { controlCls } from "@/ui/Field";
import { ChevronIcon, PlusIcon, TrashIcon } from "@/ui/icons";
import { MAX_STEP_LENGTH, MAX_STEPS, addStep, moveStep, removeStep, updateStep } from "../steps";

const iconBtnCls =
  "inline-flex size-11 items-center justify-center rounded-pill border border-line text-ink-muted transition-colors duration-150 hover:border-ink/60 hover:text-ink disabled:pointer-events-none disabled:opacity-30";

// Every change goes through steps.ts; this component only shows the list and its buttons.
export function StepsEditor({
  steps,
  onChange,
  error,
}: {
  steps: string[];
  onChange: (steps: string[]) => void;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  // Index of the step to focus after the next change: removing or moving a step can drop the focused button.
  const focusNext = useRef<number | null>(null);
  useEffect(() => {
    if (focusNext.current === null) return;
    document.getElementById(`${id}-${focusNext.current}`)?.focus();
    focusNext.current = null;
  }, [steps, id]);

  function change(next: string[], focusIndex: number) {
    focusNext.current = focusIndex;
    onChange(next);
  }

  return (
    <fieldset className="flex flex-col gap-4" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-[14px] font-medium text-ink">Scénario de test</legend>
      <p className="text-[13px] leading-snug text-ink-muted">
        De 1 à {MAX_STEPS} étapes, dans l&apos;ordre où le testeur les suit. Une consigne par étape.
      </p>
      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`${id}-${i}`}
                className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted"
              >
                Étape {i + 1}
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label={`Monter l'étape ${i + 1}`}
                  disabled={i === 0}
                  onClick={() => change(moveStep(steps, i, -1), i - 1)}
                  className={iconBtnCls}
                >
                  <ChevronIcon size={18} className="rotate-180" />
                </button>
                <button
                  type="button"
                  aria-label={`Descendre l'étape ${i + 1}`}
                  disabled={i === steps.length - 1}
                  onClick={() => change(moveStep(steps, i, 1), i + 1)}
                  className={iconBtnCls}
                >
                  <ChevronIcon size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Retirer l'étape ${i + 1}`}
                  disabled={steps.length === 1}
                  onClick={() => change(removeStep(steps, i), Math.max(i - 1, 0))}
                  className={iconBtnCls}
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
            <textarea
              id={`${id}-${i}`}
              value={step}
              maxLength={MAX_STEP_LENGTH}
              rows={2}
              placeholder="Ex. : crée une facture pour un client"
              aria-invalid={error && step.trim() === "" ? true : undefined}
              aria-describedby={error && step.trim() === "" ? errorId : undefined}
              onChange={(e) => onChange(updateStep(steps, i, e.target.value))}
              className={controlCls}
            />
          </li>
        ))}
      </ol>
      {error && (
        <p id={errorId} className="text-[14px] leading-snug text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => change(addStep(steps), steps.length)}
        disabled={steps.length >= MAX_STEPS}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-stretch rounded-pill border border-dashed border-ink/50 px-5 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink disabled:opacity-40 md:self-start"
      >
        <PlusIcon size={18} />
        Ajouter une étape
      </button>
    </fieldset>
  );
}
