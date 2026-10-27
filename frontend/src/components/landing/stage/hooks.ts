"use client";

import type { MotionValue } from "motion/react";
import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react";
import { computeLayout, type StageLayout } from "./layout";

export function useMedia(query: string, server: boolean) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => server,
  );
}

/** Variables CSS lues par les blocs texte (positions des colonnes, carte de la scène C, barre de nav). */
function writeVars(el: HTMLElement, l: StageLayout) {
  const px = (v: number) => `${Math.round(v * 10) / 10}px`;
  const vars: Record<string, string> = {
    "--st-tl": px(l.textLeft),
    "--st-tw": px(l.textWidth),
    "--st-ql": px(l.quoteLeft.left),
    "--st-qlw": px(l.quoteLeft.width),
    "--st-qr": px(l.quoteRight.left),
    "--st-qrw": px(l.quoteRight.width),
    "--st-vy": px(l.voicesY),
    "--st-vh": px((300 * l.k * l.voicesScale) / 2),
    "--st-nav": px(l.navLeft),
  };
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
}

/**
 * Mesure le cadre du stage au montage et au resize (debounce 150 ms, §4) et pousse la géométrie
 * dans une MotionValue : aucun re-render React, les transforms se recalculent seuls.
 */
export function useStageLayout(
  ref: RefObject<HTMLElement | null>,
  layout: MotionValue<StageLayout>,
  varsRef: RefObject<HTMLElement | null> = ref,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const l = computeLayout(w, h);
      writeVars(varsRef.current ?? el, l);
      layout.set(l);
    };
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(measure, 150);
    };
    measure();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [ref, layout, varsRef]);
}
