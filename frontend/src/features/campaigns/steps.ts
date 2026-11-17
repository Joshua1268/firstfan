// Each function returns a new list.
export const MAX_STEPS = 10;
export const MAX_STEP_LENGTH = 500;

export function addStep(steps: string[]): string[] {
  return steps.length < MAX_STEPS ? [...steps, ""] : steps;
}

export function removeStep(steps: string[], index: number): string[] {
  return steps.filter((_, i) => i !== index);
}

export function updateStep(steps: string[], index: number, text: string): string[] {
  return steps.map((step, i) => (i === index ? text : step));
}

export function moveStep(steps: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= steps.length) return steps;
  const moved = [...steps];
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
}

export function canSubmit(steps: string[]): boolean {
  return (
    steps.length >= 1 &&
    steps.length <= MAX_STEPS &&
    steps.every((step) => step.trim() !== "" && step.length <= MAX_STEP_LENGTH)
  );
}
