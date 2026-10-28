import type { TestStep } from "./types";

// Index of the first step without a proof, or null when every step is done.
export function currentStepIndex(steps: TestStep[]): number | null {
  const index = steps.findIndex((step) => step.proof === null);
  return index === -1 ? null : index;
}
