import { describe, expect, it } from "vitest";
import { MAX_STEP_LENGTH, MAX_STEPS, addStep, canSubmit, moveStep, removeStep, updateStep } from "./steps";

const tenSteps = Array.from({ length: MAX_STEPS }, (_, i) => `Étape ${i + 1}`);

describe("addStep", () => {
  it("adds an empty step at the end", () => {
    expect(addStep(["Ouvre l'app"])).toEqual(["Ouvre l'app", ""]);
  });

  it("stops at the maximum", () => {
    expect(addStep(tenSteps)).toEqual(tenSteps);
  });

  it("does not change the given list", () => {
    const steps = ["a"];
    addStep(steps);
    expect(steps).toEqual(["a"]);
  });
});

describe("removeStep", () => {
  it("removes the step at the index", () => {
    expect(removeStep(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });
});

describe("updateStep", () => {
  it("replaces the text of one step", () => {
    expect(updateStep(["a", "b"], 1, "B")).toEqual(["a", "B"]);
  });
});

describe("moveStep", () => {
  it("moves a step up", () => {
    expect(moveStep(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
  });

  it("moves a step down", () => {
    expect(moveStep(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });

  it("leaves the list as is at the edges", () => {
    expect(moveStep(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveStep(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});

describe("canSubmit", () => {
  it("accepts one to ten filled steps", () => {
    expect(canSubmit(["Ouvre l'app"])).toBe(true);
    expect(canSubmit(tenSteps)).toBe(true);
  });

  it("refuses no step or more than ten", () => {
    expect(canSubmit([])).toBe(false);
    expect(canSubmit([...tenSteps, "onzième"])).toBe(false);
  });

  it("refuses an empty or blank step", () => {
    expect(canSubmit(["a", ""])).toBe(false);
    expect(canSubmit(["a", "   "])).toBe(false);
  });

  it("refuses a step longer than the limit", () => {
    expect(canSubmit(["x".repeat(MAX_STEP_LENGTH)])).toBe(true);
    expect(canSubmit(["x".repeat(MAX_STEP_LENGTH + 1)])).toBe(false);
  });
});
