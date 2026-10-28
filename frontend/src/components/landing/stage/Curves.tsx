"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useId } from "react";
import { dur } from "@/lib/motion-tokens";
import { CheckIcon } from "../icons";
import { InkRing, useStamp } from "./CardProofs";
import { go, useLayoutValue, useStage, useThreshold } from "./context";
import { CURVES } from "./copy";
import { GRAPH_VIEW as G } from "./layout";

// Step 04: the grey curve drops, the green one (the straightened loop) stays high.

const yAt = (ratio: number) => G.y0 - ratio * (G.y0 - G.top);
const GHOST_D = `M ${G.x0} ${G.top} C 110 ${G.top} 170 250 ${G.j7} ${yAt(0.04)} C 380 ${yAt(0.025)} 480 ${yAt(0.02)} ${G.j30} ${yAt(0.02)}`;
const J7 = { x: G.j7, y: yAt(0.86) };
const J30 = { x: G.j30, y: yAt(0.76) };
const GREEN_D = `M ${G.x0} ${G.top} C 140 ${G.top + 4} 200 ${J7.y - 6} ${J7.x} ${J7.y} C 380 ${J7.y + 12} 480 ${J30.y - 4} ${J30.x} ${J30.y}`;

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function Sticker({
  text,
  at,
  p,
  t,
  align,
  below = false,
}: {
  text: string;
  at: { x: number; y: number };
  p: MotionValue<number>;
  t: number;
  align: "center" | "end";
  // On a narrow graph, J7 goes below the curve so it never touches J30.
  below?: boolean;
}) {
  const s = useStamp(p, t);
  const v = below
    ? `top-3 ${align === "end" ? "origin-top-right" : "origin-top"}`
    : `bottom-3 ${align === "end" ? "origin-bottom-right" : "origin-bottom"}`;
  return (
    <div className="absolute" style={{ left: pct(at.x, G.w), top: pct(at.y, G.h) }}>
      <motion.div
        data-curve-sticker={text}
        className={`absolute ${v} ${align === "end" ? "right-[-6px]" : "left-0 -translate-x-1/2"}`}
        style={{ scale: s.scale, opacity: s.opacity, rotate: align === "end" ? 4 : -5 }}
      >
        <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold leading-none text-accent-ink shadow-[0_10px_24px_rgba(0,0,0,0.45)] lg:text-[15px]">
          <CheckIcon size={15} strokeWidth={2.5} />
          {text}
          <InkRing scale={s.inkScale} opacity={s.inkOpacity} />
        </span>
      </motion.div>
    </div>
  );
}

export function Curves({ p }: { p: MotionValue<number> }) {
  const { layout, instant } = useStage();
  // Narrow graph (mobile, small desktop).
  const narrow = useLayoutValue((l) => l.graph.w < 520);
  const clip = useId().replace(/:/g, "");
  const x = useTransform(() => layout.get().graph.cx - layout.get().graph.w / 2);
  const y = useTransform(() => layout.get().graph.cy - layout.get().graph.h / 2);
  const w = useTransform(() => layout.get().graph.w);
  const h = useTransform(() => layout.get().graph.h);
  const shown = useTransform(p, [0.8, 0.84], [0, 1], { clamp: true });
  const reveal = useTransform(p, [0.84, 0.92], [-G.w, 0], { clamp: true });
  const green = useTransform(p, [0.86, 0.97], [0, 1], { clamp: true });
  const done = p.get() >= 0.96;
  const ghostOpacity = useMotionValue(done ? 0.3 : 0.6);
  const strike = useMotionValue(done ? 1 : 0);
  const pulse = useMotionValue(1);
  useThreshold(p, 0.96, (above, initial) => {
    const now = instant || initial;
    go(ghostOpacity, above ? 0.3 : 0.6, { duration: dur.base / 1000 }, now);
    go(strike, above ? 1 : 0, { duration: 0.3, ease: "easeOut" }, now);
    if (above && !now) go(pulse, [1, 1.6, 1], { duration: 0.5, ease: "easeOut" }, false);
  });
  const dot = useTransform(green, [0.97, 1], [0, 1], { clamp: true });

  return (
    <motion.div className="absolute left-1/2 top-1/2" style={{ x, y, width: w, height: h, opacity: shown }}>
      <svg viewBox={`0 0 ${G.w} ${G.h}`} className="absolute inset-0 size-full overflow-visible">
        <defs>
          <clipPath id={clip}>
            <motion.rect y={-20} width={G.w} height={G.h + 40} style={{ x: reveal }} />
          </clipPath>
        </defs>
        <path
          d={`M ${G.x0} ${G.top - 10} V ${G.y0} H ${G.j30 + 8}`}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1.5}
        />
        {[G.j7, G.j30].map((gx) => (
          <path key={gx} d={`M ${gx} ${G.y0} v 6`} stroke="var(--line)" strokeWidth={1.5} />
        ))}
        <motion.path
          d={GHOST_D}
          fill="none"
          stroke="var(--ghost)"
          strokeWidth={2}
          strokeDasharray="6 6"
          clipPath={`url(#${clip})`}
          style={{ opacity: ghostOpacity }}
        />
        <motion.path
          d={GREEN_D}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ pathLength: green }}
        />
        <motion.circle
          cx={J30.x}
          cy={J30.y}
          r={5}
          fill="var(--accent)"
          style={{ scale: pulse, opacity: dot, transformBox: "fill-box", transformOrigin: "center" }}
        />
      </svg>
      {CURVES.axis.map((label, i) => {
        const gx = [G.x0, G.j7, G.j30][i];
        return (
          <span
            key={label}
            data-axis-label={label}
            className={`absolute font-mono text-[11px] leading-none text-ink-muted lg:text-[12px] ${i === 0 ? "" : i === 2 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: pct(gx + (i === 0 ? 30 : 0), G.w), top: pct(i === 0 ? G.y0 - 22 : G.y0 + 14, G.h) }}
          >
            {label}
          </span>
        );
      })}
      <motion.span
        data-curve-label=""
        className="absolute whitespace-nowrap text-[12px] font-medium text-ink-muted lg:text-[13px]"
        style={{ left: pct(300, G.w), top: pct(yAt(0.04) - 30, G.h) }}
      >
        <span className="relative">
          {CURVES.ghost}
          <motion.span
            className="absolute inset-x-0 top-1/2 h-[1.5px] origin-left bg-ink-muted"
            style={{ scaleX: strike }}
          />
        </span>
      </motion.span>
      <motion.span
        data-curve-label=""
        className="absolute -translate-x-full whitespace-nowrap text-[12px] font-semibold text-ink lg:text-[13px]"
        style={{
          left: pct(G.j30, G.w),
          top: narrow ? `calc(${pct(J30.y, G.h)} - 78px)` : pct(J30.y + 14, G.h),
          opacity: green,
        }}
      >
        {CURVES.green}
      </motion.span>
      <Sticker text={CURVES.j7} at={J7} p={p} t={0.9} align="center" below={narrow} />
      <Sticker text={CURVES.j30} at={J30} p={p} t={0.96} align="end" />
    </motion.div>
  );
}
