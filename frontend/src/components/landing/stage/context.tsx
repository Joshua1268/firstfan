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

/**
 * État partagé du stage. Le `p` lissé est passé en prop à chaque scène ; le reste vit ici :
 * - `layout` : géométrie (MotionValue, écrite au resize : aucun re-render) ;
 * - `pass` : avancement du passage de la carte par la brèche (0 à 1, joué en temps réel, §4) ;
 * - `colorOn` : couche couleur de la carte allumée par la cassure ;
 * - `shake` : tremblement horizontal de la carte (px) ;
 * - `recess` : recul de la boucle déclenché par la cassure (0 à 1, temps réel), combiné au scrub 0.19 à 0.22 ;
 * - `instant` : vrai dans le repli statique, les micro-chorégraphies sautent à leur état final.
 */
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

/**
 * Suivi pur d'un seuil : `update` renvoie `true` au franchissement en montant, `false` en redescendant,
 * `null` sinon. Aucun événement avant `init` (le montage décide de l'état de départ).
 */
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
  return useLayoutValue((l) => l.ring.r);
}

/** Valeur dérivée de la géométrie, en état React (elle change la structure, pas une frame) : relue au resize. */
export function useLayoutValue<T extends number | boolean | string>(pick: (l: StageLayout) => T): T {
  const { layout } = useStage();
  const subscribe = useCallback((cb: () => void) => layout.on("change", cb), [layout]);
  return useSyncExternalStore(
    subscribe,
    () => pick(layout.get()),
    () => pick(layout.get()),
  );
}

/**
 * Transform recalculé seulement quand `p` est dans [lo, hi] : hors de sa scène, un calque garde sa dernière
 * valeur (déjà invisible) au lieu de recalculer et d'allouer à chaque frame.
 * `track` liste les autres MotionValues lues par `fn` (animations en temps réel, géométrie). Motion collecte les
 * dépendances à chaque rendu React : si un rendu tombe hors de la plage, `fn` n'est pas appelé, et sans cette liste
 * le calque ne suivrait plus que `p` (une pastille en vol se figerait dès que le scroll s'arrête).
 */
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
