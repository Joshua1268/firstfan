"use client";

import {
  AnimatePresence,
  cubicBezier,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";
import { dur, ease } from "@/lib/motion-tokens";
import { go, useRingRadius, useStage, useStepValue, useThreshold } from "./context";
import { LOOP } from "./copy";
import type { StageLayout } from "./layout";

/**
 * Scène A (§3.4) : l'anneau tourne d'un tour, les labels contre-tournent, les bulles « c'est super »
 * apparaissent par seuil puis se dégonflent et tombent (scrub). Les arcs eux-mêmes sont dans `Break`.
 */

/** Angle (repère de l'anneau) de chaque label, dans l'ordre de LOOP.labels : la boucle tourne dans le sens horaire. */
const LABEL_DEG = [90, 180, 270, 360];
const ARROW_DEG = [135, 225, 315, 405];
/** L'arrow à 315° (soit -45°) tombe dans la brèche. */
const BREACH_ARROW = 2;

const linear = (t: number) => t;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const gravityEase = cubicBezier(...ease.gravity);

/** Rotation de l'anneau : un seul tour, qui s'aplatit entre 0.13 et 0.16 pour se poser sur « Personne n'utilise ». */
export function useRingRotate(p: MotionValue<number>) {
  return useTransform(p, [0, 0.13, 0.16], [0, -320, -360], { ease: [linear, easeOutCubic] });
}

/** Label actif : celui qui passe en haut, calculé par quart de tour. */
export function activeLabel(rotate: number) {
  return (((Math.round((180 - rotate) / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
}

/** Recul de la boucle (§4, étape 4) puis effacement quand la carte part vers l'étape 01. */
export function useRecess(p: MotionValue<number>) {
  const scale = useTransform(p, [0.19, 0.22], [1, 0.7], { clamp: true });
  const sharp = useTransform(p, [0.19, 0.22], [1, 0], { clamp: true });
  const blurred = useTransform(p, [0.19, 0.22, 0.29, 0.32], [0, 0.15, 0.15, 0], { clamp: true });
  return { scale, sharp, blurred };
}

const LABEL_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
const BUBBLE_SPRING = { type: "spring", stiffness: 300, damping: 20 } as const;

function RingLabel({
  i,
  r,
  rotate,
  counter,
  final,
}: {
  i: number;
  r: number;
  rotate: MotionValue<number>;
  counter: MotionValue<number>;
  final: boolean;
}) {
  const { instant } = useStage();
  const a = (LABEL_DEG[i] * Math.PI) / 180;
  const startOn = final || activeLabel(rotate.get()) === i;
  const on = useRef(startOn);
  const scale = useMotionValue(final ? 1 : startOn ? 1.2 : 1);
  const opacity = useMotionValue(startOn ? 1 : 0.4);
  useMotionValueEvent(rotate, "change", (v) => {
    if (final) return;
    const active = activeLabel(v) === i;
    if (active === on.current) return;
    on.current = active;
    go(scale, active ? 1.2 : 1, LABEL_SPRING, instant);
    go(opacity, active ? 1 : 0.4, LABEL_SPRING, instant);
  });
  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)` }}>
      <motion.div style={{ rotate: counter }}>
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-bg px-3 py-1 font-display text-[13px] font-semibold md:text-[15px] leading-none text-ink lg:text-[18px]"
          style={{ scale, opacity }}
        >
          {LOOP.labels[i]}
        </motion.span>
      </motion.div>
    </div>
  );
}

function ArcArrow({ deg, r, hidden }: { deg: number; r: number; hidden?: MotionValue<number> }) {
  const a = (deg * Math.PI) / 180;
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="absolute left-0 top-0 -ml-2 -mt-2 text-ink/40"
      style={{
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        // Tangente du cercle dans le sens horaire.
        rotate: deg + 90,
        opacity: hidden,
      }}
    >
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/** Positions des bulles autour de l'anneau (angle en degrés, distance en rayons). */
const BUBBLE_SPOTS = [
  { deg: -128, d: 1.3 },
  { deg: -14, d: 1.36 },
  { deg: 40, d: 1.3 },
  { deg: 142, d: 1.3 },
  { deg: 112, d: 1.42 },
];

function bubblePos(l: StageLayout, i: number) {
  const s = BUBBLE_SPOTS[i];
  const a = (s.deg * Math.PI) / 180;
  let x = l.ring.cx + Math.cos(a) * l.ring.r * s.d;
  const y = l.ring.cy + Math.sin(a) * l.ring.r * s.d;
  // Sur petit écran, la bulle reste dans le viewport (largeur estimée à 170px).
  const lim = l.vw / 2 - 16 - 85;
  if (!l.desktop) x = Math.max(-lim, Math.min(lim, x));
  return { x, y };
}

function Bubble({ i, p, final }: { i: number; p: MotionValue<number>; final: boolean }) {
  const { layout } = useStage();
  const t = 0.01 + 0.012 * i;
  const pop = useStepValue(p, t, 0, 1, BUBBLE_SPRING);
  const start = 0.08 + 0.012 * i;
  const d = 0.05;
  const side = i % 2 === 0 ? 1 : -1;
  const x = useTransform(() => bubblePos(layout.get(), i).x);
  const yBase = useTransform(() => bubblePos(layout.get(), i).y);
  const fall = useTransform(p, [start, start + d * 0.6, start + d], [0, 240, 360], { ease: [gravityEase, linear], clamp: true });
  const y = useTransform(() => yBase.get() + (final ? 0 : fall.get()));
  const rotate = useTransform(p, [start, start + d], [0, 22 * side], { clamp: true });
  const scaleX = useTransform(p, [start, start + d * 0.5], [1, 0.85], { clamp: true });
  const fade = useTransform(p, [start + d * 0.4, start + d], [1, 0], { clamp: true });
  const popScale = useTransform(pop, [0, 1], [0.8, 1]);
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={final ? { x, y } : { x, y, rotate, scaleX, opacity: fade }}
    >
      <motion.div style={final ? undefined : { scale: popScale, opacity: pop }} className="-translate-x-1/2 -translate-y-1/2">
        <span className="relative block whitespace-nowrap rounded-full bg-watermark px-3.5 py-2 text-[13px] leading-none text-ink-muted lg:text-[14px]">
          <span className={final ? "line-through decoration-ghost" : undefined}>{LOOP.bubbles[i]}</span>
          {/* Queue de bulle */}
          <span className="absolute -bottom-1 left-4 size-2.5 rotate-45 bg-watermark" />
        </span>
      </motion.div>
    </motion.div>
  );
}

function TourCounter({ p, final }: { p: MotionValue<number>; final: boolean }) {
  const at = (v: number) => (v < 0.04 ? -1 : v < 0.09 ? 0 : v < 0.13 ? 1 : 2);
  const [tour, setTour] = useState(() => (final ? 2 : at(p.get())));
  useMotionValueEvent(p, "change", (v) => {
    if (final) return;
    const n = at(v);
    if (n !== tour) setTour(n);
  });
  return (
    <div className="relative h-5 overflow-hidden text-center font-mono text-[12px] leading-5 tabular-nums text-ink-muted lg:text-[13px]">
      <AnimatePresence initial={false}>
        {tour >= 0 && (
          <motion.span
            key={tour}
            className="absolute inset-x-0 top-0 whitespace-nowrap"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.22, ease: ease.outQuint }}
          >
            {LOOP.tours[tour]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Loop({ p, final = false }: { p: MotionValue<number>; final?: boolean }) {
  const { layout, instant } = useStage();
  const rotate = useRingRotate(p);
  const counter = useTransform(rotate, (v) => (final ? 0 : -v));
  const ringRotate = useTransform(rotate, (v) => (final ? 0 : v));
  const { scale, sharp } = useRecess(p);
  const cx = useTransform(() => layout.get().ring.cx);
  const cy = useTransform(() => layout.get().ring.cy);
  const counterY = useTransform(() => layout.get().ring.cy + layout.get().ring.r + (layout.get().desktop ? 40 : 20));
  const r = useRingRadius();
  // La flèche prise dans la brèche disparaît à la cassure.
  const breachArrow = useMotionValue(final || p.get() >= 0.185 ? 0 : 1);
  useThreshold(p, 0.185, (above) => go(breachArrow, above ? 0 : 1, { duration: dur.fast / 1000 }, instant));
  const fade = useTransform(p, [0.29, 0.32], [1, 0], { clamp: true });

  return (
    <motion.div className="absolute inset-0" style={{ opacity: fade }}>
      <motion.div className="absolute left-1/2 top-1/2" style={{ x: cx, y: cy, scale, opacity: final ? 1 : sharp }}>
        <motion.div className="absolute left-0 top-0" style={{ rotate: ringRotate }}>
          {ARROW_DEG.map((deg, i) => (
            <ArcArrow key={deg} deg={deg} r={r} hidden={i === BREACH_ARROW ? breachArrow : undefined} />
          ))}
          {LABEL_DEG.map((_, i) => (
            <RingLabel key={i} i={i} r={r} rotate={rotate} counter={counter} final={final} />
          ))}
        </motion.div>
      </motion.div>
      <motion.div className="absolute left-1/2 top-1/2 w-[320px] -ml-[160px]" style={{ x: cx, y: counterY, opacity: sharp }}>
        <TourCounter p={p} final={final} />
      </motion.div>
      {LOOP.bubbles.map((_, i) => (
        <Bubble key={i} i={i} p={p} final={final} />
      ))}
    </motion.div>
  );
}
