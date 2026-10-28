"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { dur, spring } from "@/lib/motion-tokens";
import { go, useStage, useThreshold } from "./context";
import { CHECKLIST } from "./copy";

// Step 02 inside the card: the guided checklist, a moving cursor and capture flashes.

export const TICKS = [0.53, 0.56, 0.59, 0.62] as const;

// Cursor path in card coordinates (440x300): start, then one target per item.
const WAYPOINTS = [
  { x: 150, y: 150 },
  { x: 408, y: 49 }, // create an account
  { x: 226, y: 85 }, // add a client
  { x: 84, y: 266 }, // send an invoice
  { x: 214, y: 182 }, // chase an unpaid invoice
];

function cursorAt(v: number) {
  const d = Math.min(1, Math.max(0, (v - 0.5) / 0.12)) * 4;
  const i = Math.min(3, Math.floor(d));
  const t = d - i;
  const a = WAYPOINTS[i];
  const b = WAYPOINTS[i + 1];
  // Slight arc: control point offset perpendicular to the segment.
  const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.18;
  const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.18;
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * mx + t * t * b.x, y: u * u * a.y + 2 * u * t * my + t * t * b.y };
}

const SNAP = { type: "spring", ...spring.snap } as const;

function CheckItem({ i, p, flash }: { i: number; p: MotionValue<number>; flash: MotionValue<number> }) {
  const { instant } = useStage();
  const done = p.get() >= TICKS[i];
  const box = useMotionValue(1);
  const fill = useMotionValue(done ? 1 : 0);
  const draw = useMotionValue(done ? 1 : 0);
  useThreshold(p, TICKS[i], (above, initial) => {
    const now = instant || initial;
    go(fill, above ? 1 : 0, { duration: dur.instant / 1000 }, now);
    go(draw, above ? 1 : 0, { duration: 0.24, ease: "easeOut" }, now);
    if (above && !now) {
      go(box, [0.8, 1], SNAP, false);
      flash.set(0.5);
      go(flash, 0, { duration: dur.fast / 1000, ease: "easeOut" }, false);
    }
  });
  return (
    <li className="flex items-center gap-2.5 text-[11.5px] leading-tight text-ink">
      <motion.span
        className="relative grid size-4 flex-none place-items-center rounded-[5px] border border-ghost"
        style={{ scale: box }}
      >
        <motion.span className="absolute inset-[-1px] rounded-[5px] bg-accent" style={{ opacity: fill }} />
        <svg
          viewBox="0 0 24 24"
          className="relative size-3 text-accent-ink"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" style={{ pathLength: draw }} />
        </svg>
      </motion.span>
      {CHECKLIST[i]}
    </li>
  );
}

export function CardTest({ p }: { p: MotionValue<number> }) {
  const panel = useTransform(p, [0.48, 0.505, 0.64, 0.66], [0, 1, 1, 0], { clamp: true });
  const panelX = useTransform(panel, [0, 1], [16, 0]);
  const cursorOpacity = useTransform(p, [0.495, 0.505, 0.625, 0.635], [0, 1, 1, 0], { clamp: true });
  const cx = useTransform(p, (v) => cursorAt(v).x);
  const cy = useTransform(p, (v) => cursorAt(v).y);
  const flash = useMotionValue(0);
  return (
    <>
      <motion.div
        className="absolute bottom-3 right-3 top-[78px] w-[168px] rounded-[12px] border border-line bg-bg/95 p-3"
        style={{ opacity: panel, x: panelX }}
      >
        <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">Parcours guidé</p>
        <ul className="mt-3 flex flex-col gap-3">
          {CHECKLIST.map((_, i) => (
            <CheckItem key={i} i={i} p={p} flash={flash} />
          ))}
        </ul>
      </motion.div>
      <motion.span
        className="absolute left-0 top-0 -ml-2 -mt-2 size-4 rounded-full border-[1.5px] border-ink bg-ink/10"
        style={{ x: cx, y: cy, opacity: cursorOpacity }}
      />
      <motion.div className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: flash }} />
    </>
  );
}
