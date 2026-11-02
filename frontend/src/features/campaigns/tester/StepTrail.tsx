import { CheckIcon } from "@/ui/icons";
import { currentStepIndex } from "../progress";
import type { TestStep } from "../types";

// One round button per step: done steps can be opened again, later ones wait their turn.
export function StepTrail({
  steps,
  shown,
  onOpen,
}: {
  steps: TestStep[];
  shown: number | null;
  onOpen: (index: number) => void;
}) {
  const current = currentStepIndex(steps);
  return (
    <ol aria-label="Progression du test" className="flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const done = step.proof !== null;
        const reachable = done || index === current;
        const label = done ? `Étape ${index + 1}, faite : la modifier` : `Étape ${index + 1}`;
        return (
          <li key={step.order}>
            <button
              type="button"
              onClick={() => onOpen(index)}
              disabled={!reachable}
              aria-label={label}
              aria-current={index === shown ? "step" : undefined}
              className={`flex size-11 items-center justify-center rounded-full border font-mono text-[14px] transition-colors duration-150 disabled:cursor-not-allowed ${
                done ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-muted"
              } ${index === shown ? "outline outline-2 outline-offset-2 outline-ink" : ""}`}
            >
              {done ? <CheckIcon size={20} strokeWidth={2} /> : index + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
