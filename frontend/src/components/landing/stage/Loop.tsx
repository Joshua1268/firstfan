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
import { useCallback, useRef, useState, type RefObject } from "react";
import { dur, ease } from "@/lib/motion-tokens";
import { go, useRingRadius, useStage, useStepValue, useThreshold } from "./context";
import { LOOP } from "./copy";
import type { StageLayout } from "./layout";

// Scene A: the ring turns once while praise bubbles appear and fall. The arcs live in Break.

// Angle of each label, in LOOP.labels order.
const LABEL_DEG = [90, 180, 270, 360];
const ARROW_DEG = [135, 225, 315, 405];
// The arrow at 315 degrees falls into the gap.
const BREACH_ARROW = 2;
// The label on top when the ring stops; the only one left after the break.
const STOP_LABEL = 2;

const linear = (t: number) => t;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const gravityEase = cubicBezier(...ease.gravity);

// One turn, easing out between 0.13 and 0.16 to stop on the top label.
export function useRingRotate(p: MotionValue<number>) {
  return useTransform(p, [0, 0.13, 0.16], [0, -320, -360], { ease: [linear, easeOutCubic] });
}

export function activeLabel(rotate: number) {
  return (((Math.round((180 - rotate) / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
}

// The ring moves back at the break and stays sharp through scene B; it fades to the blurred layer from 0.22.
export function useRecess(p: MotionValue<number>) {
  const { recess, layout } = useStage();
  const scrub = useTransform(p, [0.19, 0.22], [0, 1], { clamp: true });
  const toGhost = useTransform(p, [0.22, 0.26], [0, 1], { clamp: true });
  const out = useTransform(p, [0.29, 0.32], [1, 0], { clamp: true });
  // Scroll-driven, plus a real-time move back right after the card passes.
  const prog = useTransform(() => Math.max(scrub.get(), recess.get()));
  const scale = useTransform(() => 1 - (1 - layout.get().ring.recessScale) * prog.get());
  const sharp = useTransform(() => (1 - 0.15 * prog.get()) * (1 - toGhost.get()));
  const blurred = useTransform(() => 0.15 * prog.get() * toGhost.get() * out.get());
  // Hidden once the ring is broken (turn counter).
  const spent = useTransform(prog, (v) => 1 - v);
  const x = useTransform(() => {
    const r = layout.get().ring;
    return r.cx + (r.drift - r.cx) * prog.get();
  });
  const y = useTransform(() => {
    const r = layout.get().ring;
    return r.cy + r.driftY * prog.get();
  });
  return { scale, sharp, blurred, spent, x, y };
}

const LABEL_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
const BUBBLE_SPRING = { type: "spring", stiffness: 300, damping: 20 } as const;

function RingLabel({
  i,
  r,
  rotate,
  counter,
  spent,
  onSize,
  final,
}: {
  i: number;
  r: number;
  rotate: MotionValue<number>;
  counter: MotionValue<number>;
  // Label size in px, read by bubbles to fade while it passes.
  onSize: (i: number, size: { w: number; h: number }) => void;
  // Side labels fade after the break.
  spent: MotionValue<number>;
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
    <div
      className="absolute left-0 top-0"
      style={{ transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)` }}
    >
      <motion.div style={{ rotate: counter, opacity: i === STOP_LABEL ? 1 : spent }}>
        <motion.span
          ref={(el) => {
            if (el) onSize(i, { w: el.offsetWidth, h: el.offsetHeight });
          }}
          data-ring-label=""
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-bg px-3 py-1 font-display text-[13px] font-semibold md:text-[15px] leading-none text-ink lg:text-[18px]"
          style={{ scale }}
        >
          {/* Opaque background hides the ring stroke; only the text fades. */}
          <motion.span style={{ opacity }}>{LOOP.labels[i]}</motion.span>
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
        // Clockwise tangent.
        rotate: deg + 90,
        opacity: hidden,
      }}
    >
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

// Bubble positions: angle in degrees, distance in radii.
const BUBBLE_SPOTS = [
  { deg: -128, d: 1.3 },
  { deg: -14, d: 1.36 },
  { deg: 40, d: 1.3 },
  { deg: 142, d: 1.3 },
  { deg: 136, d: 1.42 },
];

// Mobile: fixed slots that never cover the labels or the counter.
const BUBBLE_SPOTS_MOBILE = [
  { x: -1.05, y: -0.62 },
  { x: 1.05, y: -0.62 },
  { x: 1.05, y: 0.66 },
  { x: -1.05, y: 0.66 },
  { x: 0, y: -1.4 },
];

function bubblePos(l: StageLayout, i: number) {
  if (!l.desktop) {
    const m = BUBBLE_SPOTS_MOBILE[i];
    const lim = l.vw / 2 - 16 - 85;
    return { x: Math.max(-lim, Math.min(lim, l.ring.cx + m.x * l.ring.r)), y: l.ring.cy + m.y * l.ring.r };
  }
  const s = BUBBLE_SPOTS[i];
  const a = (s.deg * Math.PI) / 180;
  return { x: l.ring.cx + Math.cos(a) * l.ring.r * s.d, y: l.ring.cy + Math.sin(a) * l.ring.r * s.d };
}

type LabelSizes = RefObject<{ w: number; h: number }[]>;
type RingFrame = { cx: MotionValue<number>; cy: MotionValue<number>; rotate: MotionValue<number>; sizes: LabelSizes };

// Gap in px before a bubble starts fading near a label, and fade length.
const CLEAR_GAP = 6;
const CLEAR_RAMP = 14;

// Gap in px (positive when apart) to the nearest label; a bubble fades while a label crosses it.
export function labelGap(
  bubble: { x: number; y: number; w: number; h: number },
  ring: { cx: number; cy: number; r: number; rotate: number },
  labels: { w: number; h: number }[],
) {
  let gap = Infinity;
  labels.forEach((size, i) => {
    if (!size) return;
    const a = ((LABEL_DEG[i] + ring.rotate) * Math.PI) / 180;
    const lx = ring.cx + Math.cos(a) * ring.r;
    const ly = ring.cy + Math.sin(a) * ring.r;
    // The active label grows to 1.2, so always use that size.
    const dx = Math.abs(bubble.x - lx) - (bubble.w / 2 + (size.w * 1.2) / 2);
    const dy = Math.abs(bubble.y - ly) - (bubble.h / 2 + (size.h * 1.2) / 2);
    gap = Math.min(gap, Math.max(dx, dy));
  });
  return gap;
}

function Bubble({ i, p, final, ring }: { i: number; p: MotionValue<number>; final: boolean; ring: RingFrame }) {
  const { layout } = useStage();
  const t = 0.01 + 0.012 * i;
  const pop = useStepValue(p, t, 0, 1, BUBBLE_SPRING);
  const start = 0.08 + 0.012 * i;
  const d = 0.05;
  const side = i % 2 === 0 ? 1 : -1;
  const size = useRef({ w: 0, h: 0 });
  const x = useTransform(() => bubblePos(layout.get(), i).x);
  const yBase = useTransform(() => bubblePos(layout.get(), i).y);
  const fall = useTransform(p, [start, start + d * 0.6, start + d], [0, 240, 360], {
    ease: [gravityEase, linear],
    clamp: true,
  });
  const y = useTransform(() => yBase.get() + (final ? 0 : fall.get()));
  const rotate = useTransform(p, [start, start + d], [0, 22 * side], { clamp: true });
  const scaleX = useTransform(p, [start, start + d * 0.5], [1, 0.85], { clamp: true });
  const fade = useTransform(p, [start + d * 0.4, start + d], [1, 0], { clamp: true });
  const clear = useTransform(() => {
    const gap = labelGap(
      { x: x.get(), y: y.get(), w: size.current.w, h: size.current.h },
      { cx: ring.cx.get(), cy: ring.cy.get(), r: layout.get().ring.r, rotate: ring.rotate.get() },
      ring.sizes.current,
    );
    return Math.min(1, Math.max(0, (gap - CLEAR_GAP) / CLEAR_RAMP));
  });
  const opacity = useTransform(() => fade.get() * clear.get());
  const popScale = useTransform(pop, [0, 1], [0.8, 1]);
  return (
    <motion.div className="absolute left-1/2 top-1/2" style={final ? { x, y } : { x, y, rotate, scaleX, opacity }}>
      <motion.div
        style={final ? undefined : { scale: popScale, opacity: pop }}
        className="-translate-x-1/2 -translate-y-1/2"
      >
        <span
          ref={(el) => {
            if (el) size.current = { w: el.offsetWidth, h: el.offsetHeight + 6 };
          }}
          data-loop-bubble=""
          className="relative block whitespace-nowrap rounded-full bg-watermark px-3.5 py-2 text-[13px] leading-none text-ink-muted lg:text-[14px]"
        >
          <span className={final ? "line-through decoration-ghost" : undefined}>{LOOP.bubbles[i]}</span>
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
    <div
      data-tour=""
      className="relative mx-auto h-5 w-fit min-w-[220px] overflow-hidden text-center font-mono text-[12px] leading-5 tabular-nums text-ink-muted lg:text-[13px]"
    >
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
  const { scale, sharp, spent, x: cx, y: cy } = useRecess(p);
  const counterY = useTransform(() => layout.get().ring.cy + layout.get().ring.r + (layout.get().desktop ? 48 : 20));
  const r = useRingRadius();
  // The arrow in the gap disappears at the break.
  const breachArrow = useMotionValue(final || p.get() >= 0.185 ? 0 : 1);
  useThreshold(p, 0.185, (above) => go(breachArrow, above ? 0 : 1, { duration: dur.fast / 1000 }, instant));
  const fade = useTransform(p, [0.29, 0.32], [1, 0], { clamp: true });
  const sizes: LabelSizes = useRef([]);
  const onSize = useCallback((i: number, size: { w: number; h: number }) => {
    sizes.current[i] = size;
  }, []);
  const ringFrame: RingFrame = { cx, cy, rotate: ringRotate, sizes };

  return (
    <motion.div className="absolute inset-0" style={{ opacity: fade }}>
      {/* Stacking: stroke and arrows, then bubbles, then labels, so no text is ever hidden. */}
      <motion.div
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{ x: cx, y: cy, scale, opacity: final ? 1 : sharp }}
      >
        <motion.div className="absolute left-0 top-0 will-change-transform" style={{ rotate: ringRotate }}>
          {ARROW_DEG.map((deg, i) => (
            <ArcArrow key={deg} deg={deg} r={r} hidden={i === BREACH_ARROW ? breachArrow : undefined} />
          ))}
        </motion.div>
      </motion.div>
      {LOOP.bubbles.map((_, i) => (
        <Bubble key={i} i={i} p={p} final={final} ring={ringFrame} />
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{ x: cx, y: cy, scale, opacity: final ? 1 : sharp }}
      >
        <motion.div className="absolute left-0 top-0 will-change-transform" style={{ rotate: ringRotate }}>
          {LABEL_DEG.map((_, i) => (
            <RingLabel
              key={i}
              i={i}
              r={r}
              rotate={rotate}
              counter={counter}
              spent={spent}
              onSize={onSize}
              final={final}
            />
          ))}
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-1/2 w-[320px] -ml-[160px]"
        style={{ x: cx, y: counterY, opacity: spent }}
      >
        <TourCounter p={p} final={final} />
      </motion.div>
    </motion.div>
  );
}
