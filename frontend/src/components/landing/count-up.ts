import { animate, type MotionValue } from "motion";
import { ease } from "../../lib/motion-tokens";

type Opts = { duration?: number; delay?: number; onComplete?: () => void };

// The MotionValue starts at the server value, so it is reset to 0 before counting up.
export function startCountUp(
  count: MotionValue<number>,
  value: number,
  { duration = 1.2, delay = 0, onComplete }: Opts = {},
) {
  count.set(0);
  return animate(count, [0, value], {
    duration,
    delay,
    ease: ease.outQuint as unknown as [number, number, number, number],
    onComplete,
  });
}
