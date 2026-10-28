"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { dur, ease, spring } from "@/lib/motion-tokens";
import { ArrowIcon } from "../icons";
import { InkRing } from "./CardProofs";
import { go, useGatedTransform, useStage, useStepValue, useThreshold } from "./context";
import { RATINGS, TESTERS } from "./copy";
import { CARD_H, CARD_W, type StageLayout } from "./layout";
import { stepCenter } from "./pose";
import { CodeAvatar, JobAvatar } from "./avatars";

// Layers outside the card for steps 01 (tester cards) and 03 (two-way ratings). Step 02 lives in the card.

const SETTLE = { type: "spring", ...spring.settle } as const;
const STAMP = { type: "spring", ...spring.stamp } as const;
const ANCHOR = { type: "spring", stiffness: 300, damping: 30 } as const;
const ENTER_T = [0.33, 0.345, 0.36];
const STAMP_T = [0.37, 0.385, 0.4];
const FAN_ROT = [-4, 1.5, -2.5];
const TESTER_SCALE_MOBILE = 0.8;

function testerSpot(l: StageLayout, v: number, slot: number, count: number) {
  const c = stepCenter(l, v);
  if (l.desktop) {
    const cardLeft = c.x - (CARD_W * l.k) / 2;
    // Card height plus the stamp sticking out, so neighbours never touch.
    const gap = 126;
    // Never under the text block: on small laptops the fan tightens against the card.
    const half = 110 * Math.max(0.82, l.k) + 10;
    const minX = l.textLeft + l.textWidth + 12 + half - l.vw / 2;
    return { x: Math.max(minX, cardLeft - 86 + (slot === 1 ? -26 : 0)), y: c.y + (slot - (count - 1) / 2) * gap };
  }
  const bottom = c.y + (CARD_H * l.k) / 2;
  const gap = 96 * TESTER_SCALE_MOBILE + 30;
  return { x: (slot === 0 ? -1 : 1) * 10, y: bottom + 34 + slot * gap };
}

// Top left corner of the app card at step 01, where Awa docks.
function anchorSpot(l: StageLayout, v: number) {
  const c = stepCenter(l, v);
  return { x: c.x - (CARD_W * l.k) / 2 + 70, y: c.y - (CARD_H * l.k) / 2 + 20 };
}

function TesterCard({ index, slot, count, p }: { index: number; slot: number; count: number; p: MotionValue<number> }) {
  const { layout, instant } = useStage();
  const t = TESTERS[index];
  const isAwa = index === 0;
  const enter = useStepValue(p, ENTER_T[slot], 0, 1, SETTLE);
  const anchor = useStepValue(p, 0.42, 0, 1, ANCHOR);
  const stamped = p.get() >= STAMP_T[slot];
  const stampScale = useMotionValue(stamped ? 1 : 1.4);
  const stampRot = useMotionValue(stamped ? -4 : -12);
  const stampOpacity = useMotionValue(stamped ? 1 : 0);
  const ink = useMotionValue(0);
  const knock = useMotionValue(0);
  useThreshold(p, STAMP_T[slot], (above, initial) => {
    const now = instant || initial;
    if (above) {
      if (!now) {
        stampScale.set(1.4);
        stampRot.set(-12);
      }
      go(stampScale, 1, STAMP, now);
      go(stampRot, -4, STAMP, now);
      go(stampOpacity, 1, { duration: dur.instant / 1000 }, now);
      if (!now) {
        ink.set(0.001);
        go(ink, 1, { duration: dur.medium / 1000, ease: "easeOut" }, false);
        go(knock, [0, -3, 2, -1, 0], { duration: dur.fast / 1000, ease: "linear" }, false);
      }
    } else {
      go(stampOpacity, 0, { duration: dur.fast / 1000 }, now);
      ink.set(0);
    }
  });
  const inkScale = useTransform(ink, [0, 1], [0.6, 1.9]);
  const inkOpacity = useTransform(ink, [0, 0.001, 1], [0, 0.9, 0]);

  const x = useGatedTransform(p, 0.3, 0.5, [layout, enter, anchor, knock], () => {
    const l = layout.get();
    const v = p.get();
    const s = testerSpot(l, v, slot, count);
    const a = anchorSpot(l, v);
    const base = s.x - 120 * (1 - enter.get()) + knock.get();
    return isAwa ? base + (a.x - s.x) * anchor.get() : base;
  });
  const y = useGatedTransform(p, 0.3, 0.5, [layout, anchor], () => {
    const l = layout.get();
    const v = p.get();
    const s = testerSpot(l, v, slot, count);
    return isAwa ? s.y + (anchorSpot(l, v).y - s.y) * anchor.get() : s.y;
  });
  const rotate = useTransform(
    () => -6 * (1 - enter.get()) + FAN_ROT[slot] * (layout.get().desktop ? 1 : 0.4) * enter.get() * (1 - anchor.get()),
  );
  const leave = useTransform(p, [0.46, 0.49], [1, 0], { clamp: true });
  const scale = useGatedTransform(p, 0.3, 0.5, [layout, anchor], () => {
    const l = layout.get();
    const base = l.desktop ? Math.max(0.82, l.k) : TESTER_SCALE_MOBILE;
    return base * (isAwa ? 1 - 0.14 * anchor.get() : 1 - 0.08 * anchor.get());
  });
  const opacity = useTransform(() => enter.get() * leave.get() * (isAwa ? 1 : 1 - 0.6 * anchor.get()));

  return (
    <motion.div className="absolute left-1/2 top-1/2" style={{ x, y, rotate, scale, opacity, zIndex: isAwa ? 2 : 1 }}>
      <div
        data-tester={t.name}
        className="relative -ml-[110px] -mt-12 flex h-24 w-[220px] items-center gap-3 rounded-card border border-line bg-surface px-3.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.6)]"
      >
        <JobAvatar size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-ink">{t.name}</p>
          <p className="truncate text-[12.5px] leading-tight text-ink-muted">{t.job}</p>
          {/* Rating and tag stay on one line. */}
          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap font-mono text-[11.5px] leading-none tabular-nums text-ink">
            {t.rating}
            {"tag" in t && (
              <span className="rounded-full border border-line px-1.5 py-[3px] font-sans text-[10.5px] font-medium leading-none text-ink-muted">
                {t.tag}
              </span>
            )}
          </p>
        </div>
        <motion.span
          data-tester-stamp=""
          className="absolute -top-3 right-2 rounded-[6px] border-[1.5px] border-accent px-1.5 py-1 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.08em] text-accent"
          style={{ scale: stampScale, rotate: stampRot, opacity: stampOpacity }}
        >
          Métier vérifié
          <InkRing scale={inkScale} opacity={inkOpacity} className="rounded-[8px]" />
        </motion.span>
      </div>
    </motion.div>
  );
}

export function Testers({ p }: { p: MotionValue<number> }) {
  const { desktop } = useStage();
  // Mobile: two testers stacked below the card.
  const order = desktop ? [0, 1, 2] : [0, 2];
  return (
    <>
      {order.map((index, slot) => (
        <TesterCard key={index} index={index} slot={slot} count={order.length} p={p} />
      ))}
    </>
  );
}

/* ---------- Step 03: two-way ratings ---------- */

function avatarSpots(l: StageLayout, v: number) {
  const c = stepCenter(l, v);
  const halfW = (CARD_W * l.k) / 2;
  const halfH = (CARD_H * l.k) / 2;
  if (l.desktop) {
    const lim = l.vw / 2 - 48;
    return {
      dev: { x: c.x - halfW - 64, y: c.y + halfH * 0.35 },
      awa: { x: Math.min(lim, c.x + halfW + 56), y: c.y + halfH * 0.35 },
    };
  }
  // Mobile: avatars above the card, clear of the proof badge.
  const y = c.y - halfH - 50;
  return { dev: { x: -l.vw * 0.3, y }, awa: { x: l.vw * 0.3, y } };
}

const ARC = { duration: 0.72, ease: ease.arc };
const PILL_SCALE = [1, 1.15, 1];

// 3-point keyframes interpolated without allocating per frame.
function lerp3(k: readonly number[], t: number) {
  return t <= 0.5 ? k[0] + (k[1] - k[0]) * (t / 0.5) : k[1] + (k[2] - k[1]) * ((t - 0.5) / 0.5);
}
const RETURN = { type: "spring", stiffness: 400, damping: 34 } as const;

// A rating chip flying from one avatar to the other.
function useFlight(
  p: MotionValue<number>,
  progress: MotionValue<number>,
  from: "dev" | "awa",
  to: "dev" | "awa",
  width: number,
) {
  const { layout } = useStage();
  const stamp = useMotionValue(1);
  const lift = layout.get().desktop ? 46 : 38;
  const pos = useGatedTransform(p, 0.68, 0.82, [layout, progress], () => {
    const l = layout.get();
    const s = avatarSpots(l, p.get());
    const a = s[from];
    const b = s[to];
    const lim = l.vw / 2 - width / 2 - 12;
    const clampX = (x: number) => Math.max(-lim, Math.min(lim, x));
    const t = progress.get();
    const xs = [clampX(a.x), (a.x + b.x) / 2, clampX(b.x)];
    // Mobile: both chips do not fit on one line, so the one going to Awa uses the row above,
    const land = !l.desktop && to === "awa" ? b.y - lift - 36 : b.y - lift;
    // at departure and arrival alike.
    const start = !l.desktop && from === "dev" ? a.y - lift - 36 : a.y - lift;
    const ys = [start, Math.min(a.y, b.y) - lift - (l.desktop ? 150 : 24), land];
    return { x: lerp3(xs, t), y: lerp3(ys, t) };
  });
  const x = useTransform(pos, (v) => v.x);
  const y = useTransform(pos, (v) => v.y);
  const rotate = useTransform(progress, [0, 0.5, 1], [-10, 6, 0]);
  const scale = useTransform(() => lerp3(PILL_SCALE, progress.get()) * stamp.get());
  return { x, y, rotate, scale, stamp };
}

function Pill({
  flight,
  opacity,
  children,
}: {
  flight: ReturnType<typeof useFlight>;
  opacity: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ x: flight.x, y: flight.y, rotate: flight.rotate, scale: flight.scale, opacity, zIndex: 3 }}
    >
      <div data-rating-pill="" className="-translate-x-1/2 -translate-y-1/2">
        {children}
      </div>
    </motion.div>
  );
}

// "From to To: rating", with "vers" shown as an SVG arrow.
export function DirectedRating({
  r,
  strong = false,
}: {
  r: { from: string; to: string; value: string };
  strong?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold leading-none ${strong ? "bg-ink text-bg" : "border border-line bg-surface text-ink"}`}
    >
      {r.from}
      <ArrowIcon size={14} />
      <span className="sr-only">vers</span>
      {r.to} : {r.value}
    </span>
  );
}

function Odometer({ value }: { value: MotionValue<number> }) {
  // 4.5 to 4.6: only the decimal rolls.
  const y = useTransform(value, [0, 1], ["0em", "-1.2em"]);
  return (
    <span className="inline-flex h-[1.2em] overflow-hidden leading-[1.2em] tabular-nums">
      4,
      <motion.span className="flex flex-col" style={{ y }}>
        <span>5</span>
        <span>6</span>
      </motion.span>
    </span>
  );
}

export function Ratings({ p }: { p: MotionValue<number> }) {
  const { layout, instant, desktop } = useStage();
  const appear = useStepValue(p, 0.71, 0, 1, SETTLE);
  const leave = useTransform(p, [0.77, 0.8], [1, 0], { clamp: true });
  const shown = useTransform(() => appear.get() * leave.get());
  const avatarScale = useTransform(appear, [0, 1], [0.6, 1]);
  const flown = p.get() >= 0.72;
  const toDev = useMotionValue(flown ? 1 : 0);
  const toTester = useMotionValue(flown ? 1 : 0);
  const odo = useMotionValue(flown ? 1 : 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const a = useFlight(p, toDev, "awa", "dev", 210);
  const b = useFlight(p, toTester, "dev", "awa", 280);

  useThreshold(p, 0.72, (above, initial) => {
    const now = instant || initial;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (above) {
      go(toDev, 1, ARC, now);
      go(odo, 1, { type: "spring", ...spring.odometer }, now);
      if (now) {
        toTester.set(1);
        return;
      }
      // On arrival, stamp the chip, then send the reverse chip 400ms later.
      later(720, () => {
        a.stamp.set(1.4);
        go(a.stamp, 1, STAMP, false);
      });
      later(720 + 400, () => go(toTester, 1, ARC, false));
      later(720 + 400 + 720, () => {
        b.stamp.set(1.4);
        go(b.stamp, 1, STAMP, false);
      });
    } else {
      go(toDev, 0, RETURN, now);
      go(toTester, 0, RETURN, now);
      go(odo, 0, { type: "spring", ...spring.odometer }, now);
    }
  });

  const spots = useGatedTransform(p, 0.68, 0.82, [layout], () => avatarSpots(layout.get(), p.get()));
  const devX = useTransform(spots, (s) => s.dev.x);
  const devY = useTransform(spots, (s) => s.dev.y);
  const awaX = useTransform(spots, (s) => s.awa.x);
  const awaY = useTransform(spots, (s) => s.awa.y);
  const size = desktop ? 48 : 32;

  return (
    <>
      {(
        [
          { x: devX, y: devY, label: "Dev", avatar: <CodeAvatar size={size} />, odo: true },
          { x: awaX, y: awaY, label: "Awa K.", avatar: <JobAvatar size={size} />, odo: false },
        ] as const
      ).map((av) => (
        <motion.div
          key={av.label}
          className="absolute left-1/2 top-1/2"
          style={{ x: av.x, y: av.y, opacity: shown, scale: avatarScale }}
        >
          <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
            {av.avatar}
            <span data-avatar-label="" className="whitespace-nowrap font-mono text-[11px] leading-none text-ink-muted">
              {av.label}
              {av.odo && (
                <>
                  {" · "}
                  <Odometer value={odo} />
                </>
              )}
            </span>
          </div>
        </motion.div>
      ))}
      <Pill flight={a} opacity={shown}>
        <DirectedRating r={RATINGS.toDev} />
      </Pill>
      <Pill flight={b} opacity={shown}>
        <DirectedRating r={RATINGS.toTester} strong />
      </Pill>
    </>
  );
}
