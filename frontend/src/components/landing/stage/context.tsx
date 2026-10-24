"use client";

import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
  type MotionValue,
  type ValueAnimationTransition,
} from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { DEFAULT_LAYOUT, type StageLayout } from "./layout";

/**
 * État partagé du stage. Le `p` lissé est passé en prop à chaque scène ; le reste vit ici :
 * - `layout` : géométrie (MotionValue, écrite au resize : aucun re-render) ;
 * - `pass` : avancement du passage de la carte par la brèche (0 à 1, joué en temps réel, §4) ;
 * - `colorOn` : couche couleur de la carte allumée par la cassure ;
 * - `shake` : tremblement horizontal de la carte (px) ;
 * - `instant` : vrai dans le repli statique, les micro-chorégraphies sautent à leur état final.
 */
export type StageCtx = {
  layout: MotionValue<StageLayout>;
  pass: MotionValue<number>;
  colorOn: MotionValue<number>;
  shake: MotionValue<number>;
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
  return useMemo(() => ({ layout, pass, colorOn, shake, instant, desktop }), [layout, pass, colorOn, shake, instant, desktop]);
}

/** Anime une MotionValue, ou la pose directement en mode instantané. */
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

/**
 * Déclenche `cb(true)` quand `p` franchit `t` en montant et `cb(false)` en redescendant (§3.4 : réversible).
 * Évalué aussi au montage avec la valeur courante (`initial` vaut alors vrai).
 */
export function useThreshold(p: MotionValue<number>, t: number, cb: (above: boolean, initial: boolean) => void) {
  const state = useRef<boolean | null>(null);
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    const above = p.get() >= t;
    state.current = above;
    cbRef.current(above, true);
  }, [p, t]);
  useMotionValueEvent(p, "change", (v) => {
    const above = v >= t;
    if (state.current === null || above === state.current) return;
    state.current = above;
    cbRef.current(above, false);
  });
}

/**
 * MotionValue à deux états liée à un seuil : `from` sous `t`, `to` au-dessus, animée par `transition`.
 * La valeur initiale suit `p` dès le rendu serveur (le repli statique sort donc dans son état final).
 */
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

/** Rayon de l'anneau, en état React (il change la géométrie des tracés SVG) : relu à chaque resize. */
export function useRingRadius(): number {
  const { layout } = useStage();
  const subscribe = useCallback((cb: () => void) => layout.on("change", cb), [layout]);
  return useSyncExternalStore(
    subscribe,
    () => layout.get().ring.r,
    () => layout.get().ring.r,
  );
}
