"use client";

import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { dur, spring } from "@/lib/motion-tokens";
import { TICKS } from "./CardTest";
import { go, useStage, useStepValue, useThreshold } from "./context";
import { CARD, FEEDBACK, RATINGS, STAMPS } from "./copy";
import { CheckIcon, StarIcon } from "../icons";

/**
 * Le dossier qui s'épaissit (§3.4) : enfants de la carte, ils restent attachés à scale 0.7 en périphérie.
 * - étape 01 : badge « Métier vérifié » (0.43) ;
 * - étape 02 : polaroïds sortis de derrière la carte (4 sur desktop, 3 sur mobile), 2 restent (0.635) ;
 * - étape 03 : bulles de retour (0.66, 0.675, 0.69), puis une bulle et la pastille de note restent (0.78).
 */

const STAMP = { type: "spring", ...spring.stamp } as const;
const POP = { type: "spring", ...spring.pop } as const;
const POLAROID = { type: "spring", stiffness: 220, damping: 18 } as const;
/** Rotations « aléatoires » déterministes entre -8° et 8°. */
const POLAROID_ROT = [-6, 5, -3, 7];
export const BUBBLE_T = [0.66, 0.675, 0.69] as const;
const KEEP_T = 0.78;

/** Tampon : scale 1.4 vers 1 (relatif à `to`), opacité d'entrée en 90 ms, anneau d'encre 420 ms. */
export function useStamp(p: MotionValue<number>, t: number, to = 1) {
  const { instant } = useStage();
  const on = p.get() >= t;
  const scale = useMotionValue(on ? to : 1.4 * to);
  const opacity = useMotionValue(on ? 1 : 0);
  const ink = useMotionValue(0);
  useThreshold(p, t, (above, initial) => {
    const now = instant || initial;
    if (above) {
      scale.set(now ? to : 1.4 * to);
      go(scale, to, STAMP, now);
      go(opacity, 1, { duration: dur.instant / 1000 }, now);
      if (!now) {
        ink.set(0.001);
        go(ink, 1, { duration: dur.medium / 1000, ease: "easeOut" }, false);
      }
    } else {
      go(opacity, 0, { duration: dur.fast / 1000 }, now);
      scale.set(1.4 * to);
      ink.set(0);
    }
  });
  const inkScale = useTransform(ink, [0, 1], [0.6, 1.8]);
  const inkOpacity = useTransform(ink, [0, 0.001, 1], [0, 0.9, 0]);
  return { scale, opacity, inkScale, inkOpacity };
}

export function InkRing({ scale, opacity, className = "" }: { scale: MotionValue<number>; opacity: MotionValue<number>; className?: string }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-full border-2 border-accent ${className}`}
      style={{ scale, opacity }}
    />
  );
}

function VerifiedBadge({ p }: { p: MotionValue<number> }) {
  const s = useStamp(p, 0.43, 0.7);
  return (
    <motion.div className="absolute -left-7 -top-5 origin-top-left" style={{ scale: s.scale, opacity: s.opacity, rotate: -6 }}>
      <span className="relative inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[15px] font-semibold leading-none text-accent-ink">
        <CheckIcon size={16} strokeWidth={2.5} />
        {CARD.proof}
        <InkRing scale={s.inkScale} opacity={s.inkOpacity} />
      </span>
    </motion.div>
  );
}

function Polaroid({ i, p, desktop }: { i: number; p: MotionValue<number>; desktop: boolean }) {
  const out = useStepValue(p, TICKS[i], 0, 1, POLAROID, { duration: 0.3, ease: "easeIn" });
  const kept = i < 2;
  const trim = useStepValue(p, 0.635, 0, 1, { type: "spring", stiffness: 260, damping: 26 });
  const shown = useTransform(() => out.get() * (kept ? 1 : 1 - trim.get()));
  const x = useTransform(shown, [0, 1], [-96, 0]);
  const y = useTransform(shown, [0, 1], [20, 0]);
  const scale = useTransform(trim, [0, 1], [1, kept ? 0.7 : 1]);
  // Rangé derrière la carte, il est masqué : certains dépasseraient du bord droit.
  const opacity = useTransform(shown, [0, 0.08], [0, 1]);
  return (
    <motion.div
      className="absolute w-[86px] origin-top-left rounded-[var(--radius-polaroid)] bg-ink p-[5px] pb-0 shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
      style={{
        left: 404 + i * 22,
        top: 14 + i * 54,
        x,
        y,
        scale,
        opacity,
        rotate: POLAROID_ROT[i],
        z: desktop ? -10 * (i + 1) : 0,
      }}
    >
      <div className="flex h-[62px] flex-col gap-1.5 rounded-[2px] bg-surface p-2">
        <span className="h-1.5 w-10 rounded-full bg-ink/30" />
        <span className="h-1.5 w-14 rounded-full bg-ink/15" />
        <span className="mt-auto h-3 w-9 rounded-full bg-ink/60" />
      </div>
      <p className="py-1 text-center font-mono text-[9px] leading-none tabular-nums text-bg">{STAMPS[i]}</p>
    </motion.div>
  );
}

export function FeedbackBubble({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`relative block rounded-[16px] rounded-tr-[4px] bg-ink px-3.5 py-2.5 text-[13px] font-medium leading-snug text-bg ${className}`}>
      {text}
    </span>
  );
}

function Bubble({ i, p, desktop }: { i: number; p: MotionValue<number>; desktop: boolean }) {
  const { instant } = useStage();
  const level = (v: number) => BUBBLE_T.filter((t) => v >= t).length - 1;
  const visible = (v: number) => {
    if (v >= KEEP_T) return i === 0;
    return desktop ? level(v) >= i : level(v) === i;
  };
  const target = (v: number) => (visible(v) ? 1 : 0);
  const pop = useMotionValue(target(p.get()));
  const last = useRef(target(p.get()));
  const keep = useStepValue(p, KEEP_T, 0, 1, { type: "spring", stiffness: 260, damping: 26 });
  useMotionValueEvent(p, "change", (v) => {
    const t = target(v);
    if (t === last.current) return;
    last.current = t;
    go(pop, t, t ? POP : { duration: dur.fast / 1000 }, instant);
  });
  const scale = useTransform(() => (0.6 + 0.4 * pop.get()) * (1 - 0.3 * keep.get()));
  return (
    <motion.div
      className="absolute w-[248px] origin-top-right"
      style={{
        right: desktop ? -40 : -12,
        top: desktop ? -44 + i * 52 : 196,
        scale,
        opacity: pop,
      }}
    >
      <FeedbackBubble text={FEEDBACK[i]} />
    </motion.div>
  );
}

export function RatingPill({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold leading-none text-ink ${className}`}>
      <StarIcon size={14} />
      {value}
    </span>
  );
}

function RatingProof({ p }: { p: MotionValue<number> }) {
  const s = useStamp(p, KEEP_T, 0.7);
  return (
    <motion.div className="absolute -bottom-4 -right-5 origin-bottom-right" style={{ scale: s.scale, opacity: s.opacity }}>
      <RatingPill value={RATINGS.toDev.value} />
    </motion.div>
  );
}

export function CardProofs({ p, layer }: { p: MotionValue<number>; layer: "behind" | "front" }) {
  const { desktop } = useStage();
  if (layer === "behind") {
    return (
      <>
        {STAMPS.slice(0, desktop ? 4 : 3).map((_, i) => (
          <Polaroid key={i} i={i} p={p} desktop={desktop} />
        ))}
      </>
    );
  }
  return (
    <>
      <VerifiedBadge p={p} />
      {FEEDBACK.map((_, i) => (
        <Bubble key={i} i={i} p={p} desktop={desktop} />
      ))}
      <RatingProof p={p} />
    </>
  );
}
