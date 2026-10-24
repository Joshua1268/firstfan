"use client";

import type { Variants } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { spring } from "@/lib/motion-tokens";

/**
 * Outils partagés des sections sous l'histoire (§3.5 à §3.11).
 *
 * Les entrées `whileInView` posent un état initial (opacité 0, décalage) dans le HTML serveur.
 * Sans JS, la feuille `REVEAL_NO_JS` (servie dans un <noscript>) force l'état final : le texte reste lisible.
 * En reduced-motion, `useReveal` monte directement l'état final, sans attendre l'entrée dans le viewport.
 */


/**
 * Préférence reduced-motion sans écart d'hydratation : `false` pendant l'hydratation (comme le HTML serveur),
 * puis la vraie valeur au rendu suivant. À utiliser dès qu'un élément est rendu ou non selon la préférence.
 */
export function useReduce() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function useReveal(amount = 0.35) {
  const reduce = useReduce();
  return reduce
    ? ({ initial: false, animate: "show" } as const)
    : ({ initial: "hidden", whileInView: "show", viewport: { once: true, amount } } as const);
}

/** Entrée « carte » : y vers 0 en spring, avec un décalage par index (`custom`). */
export function riseVariants(y: number, s: { stiffness: number; damping: number }, stagger: number, delay = 0): Variants {
  return {
    hidden: { opacity: 0, y },
    show: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { type: "spring", ...s, delay: delay + i * stagger, opacity: { duration: 0.24, delay: delay + i * stagger } },
    }),
  };
}

export const STAMP_SPRING = { type: "spring", ...spring.stamp } as const;

/** Onglet affiché (les boucles et le polling s'arrêtent quand il est caché, §6 règle 7). */
export function usePageVisible() {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}

export function useMediaQuery(query: string, server = false) {
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

export const kickerCls =
  "font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted";
export const h2Cls =
  "font-display text-[length:var(--text-h2)] font-extrabold leading-[var(--leading-h2)] tracking-[var(--tracking-h2)] text-ink [font-variation-settings:'wdth'_75] text-balance";
export const leadCls = "max-w-[46ch] text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink-muted";
export const containerCls = "mx-auto w-full max-w-[calc(var(--grid-max)+2*var(--grid-margin))] px-[var(--grid-margin)]";

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${kickerCls} ${className}`}>{children}</p>;
}
