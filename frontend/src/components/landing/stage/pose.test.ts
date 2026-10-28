import { describe, expect, it } from "vitest";
import { computeLayout, passPoint } from "./layout";
import { cardPose } from "./pose";

const l = computeLayout(1440, 900);

describe("card milestones", () => {
  it("sits grey and small in the ring during the loop", () => {
    const pose = cardPose(0.12, 0, 0, l);
    expect(pose).toMatchObject({ x: l.ring.cx, y: l.ring.cy, rotateY: 0 });
    expect(pose.scale).toBeCloseTo(0.6 * l.k);
    expect(pose.color).toBe(0);
    expect(pose.opacity).toBeLessThan(0.7);
  });
  it("is full size and opaque once through the breach", () => {
    const pose = cardPose(0.195, 1, 0, l);
    expect(pose.scale).toBeCloseTo(l.k);
    expect(pose.opacity).toBe(1);
  });
  it("stays beside the breach for most of the break scene", () => {
    const pose = cardPose(0.212, 1, 0, l);
    expect(pose.x).toBeCloseTo(l.ring.cx + passPoint(l.pass, 1).x);
  });
  it("is centred between the two voices", () => {
    const pose = cardPose(0.26, 1, 0, l);
    expect(pose.x).toBeCloseTo(0);
    expect(pose.scale).toBeCloseTo(l.voicesScale * l.k);
  });
  it("follows the steps milestones", () => {
    expect(cardPose(0.4, 1, 0, l)).toMatchObject({ x: l.rightCx, rotateY: -8 });
    expect(cardPose(0.56, 1, 0, l).scale).toBeCloseTo(1.18 * l.k);
    expect(cardPose(0.56, 1, 0, l).rotateY).toBeCloseTo(-4);
    expect(cardPose(0.72, 1, 0, l).rotateY).toBeCloseTo(-6);
    expect(cardPose(0.92, 1, 0, l).scale).toBeCloseTo(0.4 * l.k);
    expect(cardPose(0.92, 1, 0, l).rotateY).toBeCloseTo(0);
  });
});

describe("card thumbnail on small screens", () => {
  for (const [vw, vh] of [
    [375, 812],
    [820, 1180],
    [1024, 768],
  ] as const) {
    it(`${vw}x${vh}: stays on screen at the graph origin`, () => {
      const lay = computeLayout(vw, vh);
      const pose = cardPose(1, 1, 0, lay);
      expect(vw / 2 + pose.x - (440 * pose.scale) / 2).toBeGreaterThanOrEqual(0);
    });
  }
});
