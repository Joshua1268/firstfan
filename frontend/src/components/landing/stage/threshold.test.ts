import { describe, expect, it } from "vitest";
import { createThresholdTracker } from "./context";

describe("threshold tracker (useThreshold)", () => {
  it("fires up when p crosses the threshold, and down when scrolling back", () => {
    const t = createThresholdTracker(0.185);
    expect(t.init(0.1)).toBe(false);
    expect(t.update(0.15)).toBeNull();
    expect(t.update(0.19)).toBe(true);
    expect(t.update(0.3)).toBeNull();
    // Retour vers le haut : la micro-chorégraphie s'inverse.
    expect(t.update(0.1)).toBe(false);
    expect(t.update(0.12)).toBeNull();
    expect(t.update(0.185)).toBe(true);
  });
  it("starts in the state of the current p (reload mid-stage) and stays silent before init", () => {
    const t = createThresholdTracker(0.72);
    expect(t.update(0.9)).toBeNull();
    expect(t.init(0.9)).toBe(true);
    expect(t.update(0.95)).toBeNull();
    expect(t.update(0.5)).toBe(false);
  });
});
