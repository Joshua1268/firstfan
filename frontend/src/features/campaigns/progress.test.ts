import { describe, expect, it } from "vitest";
import { currentStepIndex } from "./progress";

const proof = { id: 1, answer: "", capture_url: "/api/proofs/1/capture/", updated_at: "2026-10-28T10:00:00Z" };
const step = (order: number, done: boolean) => ({ order, instruction: `Étape ${order}`, proof: done ? proof : null });

describe("currentStepIndex", () => {
  it("starts at the first step when nothing is done", () => {
    expect(currentStepIndex([step(1, false), step(2, false)])).toBe(0);
  });

  it("resumes at the first step without proof", () => {
    expect(currentStepIndex([step(1, true), step(2, true), step(3, false)])).toBe(2);
  });

  it("goes back to a skipped step before a later done one", () => {
    expect(currentStepIndex([step(1, true), step(2, false), step(3, true)])).toBe(1);
  });

  it("returns null when every step has a proof", () => {
    expect(currentStepIndex([step(1, true), step(2, true)])).toBeNull();
  });

  it("returns null for an empty scenario", () => {
    expect(currentStepIndex([])).toBeNull();
  });
});
