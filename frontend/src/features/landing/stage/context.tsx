"use client";

import {
  animate,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  type AnimationPlaybackControls,
  type MotionValue,
  type ValueAnimationTransition,
} from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { DEFAULT_LAYOUT, type StageLayout } from "./layout";

// `instant` jumps animations to their end in the fallback.
export type StageCtx = {
  layout: MotionValue<StageLayout>;
  pass: MotionValue<number>;
  colorOn: MotionValue<number>;
  shake: MotionValue<number>;
  recess: MotionValue<number>;
  instant: boolean;
  desktop: boolean;
};

const Ctx = createContext<StageCtx | null>(null);
export const StageProvider = Ctx.Provider;

export function useStage(): StageCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStage hors du stage");
  return c;
}

export function useStageValues(desktop: boolean, instant: boolean, initialPass: number): StageCtx {
  const layout = useMotionValue<StageLayout>(DEFAULT_LAYOUT);
  const pass = useMotionValue(initialPass);
  const colorOn = useMotionValue(initialPass);
  const shake = useMotionValue(0);
  const recess = useMotionValue(initialPass);
  return useMemo(
    () => ({ layout, pass, colorOn, shake, recess, instant, desktop }),
    [layout, pass, colorOn, shake, recess, instant, desktop],
  );
}

export function go(
  mv: MotionValue<number>,
  to: number | number[],
  transition: ValueAnimationTransition<number>,
  instant: boolean,
): AnimationPlaybackControls | undefined {
  if (instant) {
    mv.set(Array.isArray(to) ? to[to.length - 1] : to);
    return undefined;
  }
  return animate(mv, to, transition);
}

// Calls cb(true) when p goes above t, cb(false) when it goes back; also once on mount.
export function useThreshold(p: MotionValue<number>, t: number, cb: (above: boolean, initial: boolean) => void) {
  const tracker = useRef<ThresholdTracker | null>(null);
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    tracker.current = createThresholdTracker(t);
    cbRef.current(tracker.current.init(p.get()), true);
  }, [p, t]);
  useMotionValueEvent(p, "change", (v) => {
    const crossed = tracker.current?.update(v);
    if (crossed !== null && crossed !== undefined) cbRef.current(crossed, false);
  });
}

export type ThresholdTracker = { init(v: number): boolean; update(v: number): boolean | null };

export function createThresholdTracker(t: number): ThresholdTracker {
  let state: boolean | null = null;
  return {
    init(v) {
      state = v >= t;
      return state;
    },
    update(v) {
      const above = v >= t;
      if (state === null || above === state) return null;
      state = above;
      return above;
    },
  };
}

// `from` below t, `to` above; the initial value already follows p on the server.
export function useStepValue(
  p: MotionValue<number>,
  t: number,
  from: number,
  to: number,
  transition: ValueAnimationTransition,
  back?: ValueAnimationTransition,
): MotionValue<number> {
  const { instant } = useStage();
  const mv = useMotionValue(p.get() >= t ? to : from);
  useThreshold(p, t, (above, initial) => {
    const target = above ? to : from;
    if (mv.get() === target) return;
    go(mv, target, above ? transition : (back ?? transition), instant || initial);
  });
  return mv;
}

// React state because it changes the SVG paths.
export function useRingRadius(): number {
  return useLayoutValue((l) => l.ring.r);
}

export function useLayoutValue<T extends number | boolean | string>(pick: (l: StageLayout) => T): T {
  const { layout } = useStage();
  const subscribe = useCallback((cb: () => void) => layout.on("change", cb), [layout]);
  return useSyncExternalStore(
    subscribe,
    () => pick(layout.get()),
    () => pick(layout.get()),
  );
}

// `track` lists values fn reads that Motion could miss.
export function useGatedTransform<T>(
  p: MotionValue<number>,
  lo: number,
  hi: number,
  track: readonly { get(): unknown }[],
  fn: () => T,
): MotionValue<T> {
  const cache = useRef<{ v: T } | null>(null);
  return useTransform(() => {
    const v = p.get();
    for (const mv of track) mv.get();
    if (cache.current && (v < lo || v > hi)) return cache.current.v;
    cache.current = { v: fn() };
    return cache.current.v;
  });
}
