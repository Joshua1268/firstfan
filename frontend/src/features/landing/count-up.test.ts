import { beforeAll, describe, expect, it } from "vitest";

// Node has no requestAnimationFrame, which Motion's frame loop needs.
beforeAll(() => {
  globalThis.requestAnimationFrame ??= (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
});

const load = async () => ({ ...(await import("motion")), ...(await import("./count-up")) });

describe("startCountUp", () => {
  it("rolls from 0 to the server value, even when the motion value already holds it", async () => {
    const { motionValue, startCountUp } = await load();
    const count = motionValue(42);
    const seen: number[] = [];
    count.on("change", (v) => seen.push(v));
    await new Promise<void>((resolve) => {
      startCountUp(count, 42, { duration: 0.2, delay: 0, onComplete: resolve });
      // Counting restarts from 0 right away.
      expect(count.get()).toBe(0);
    });
    expect(seen.some((v) => v > 0 && v < 42)).toBe(true);
    expect(count.get()).toBe(42);
  });

  it("ends at 0 for a zero value", async () => {
    const { motionValue, startCountUp } = await load();
    const count = motionValue(0);
    await new Promise<void>((resolve) => startCountUp(count, 0, { duration: 0.2, delay: 0, onComplete: resolve }));
    expect(count.get()).toBe(0);
  });
});
