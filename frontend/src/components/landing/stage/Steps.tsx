"use client";

import { interpolate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { dur, ease, spring } from "@/lib/motion-tokens";
import { ArrowIcon } from "../icons";
import { InkRing } from "./CardProofs";
import { go, useStage, useStepValue, useThreshold } from "./context";
import { RATINGS, TESTERS } from "./copy";
import { CARD_H, CARD_W, type StageLayout } from "./layout";
import { stepCenter } from "./pose";
import { CodeAvatar, JobAvatar } from "./avatars";

/**
 * Calques hors carte des étapes 01 et 03 (§3.4, scènes D et F) :
 * - les cartes testeurs en éventail, tamponnées, puis Awa qui s'ancre à la carte de l'app ;
 * - les avatars dev et Awa, et les pastilles de note qui volent dans les deux sens.
 * L'étape 02 se joue dans la carte (CardTest, CardProofs).
 */

const SETTLE = { type: "spring", ...spring.settle } as const;
const STAMP = { type: "spring", ...spring.stamp } as const;
const ANCHOR = { type: "spring", stiffness: 300, damping: 30 } as const;
const ENTER_T = [0.33, 0.345, 0.36];
const STAMP_T = [0.37, 0.385, 0.4];
const FAN_ROT = [-4, 1.5, -2.5];

/** Position (centre) de la carte testeur `slot` dans le repère du stage. */
function testerSpot(l: StageLayout, v: number, slot: number, count: number) {
  const c = stepCenter(l, v);
  if (l.desktop) {
    const cardLeft = c.x - (CARD_W * l.k) / 2;
    const gap = 112;
    return { x: cardLeft - 86 + (slot === 1 ? -26 : 0), y: c.y + (slot - (count - 1) / 2) * gap };
  }
  const bottom = c.y + (CARD_H * l.k) / 2;
  return { x: (slot === 0 ? -1 : 1) * 10, y: bottom + 30 + slot * 74 };
}

/** Coin haut gauche de la carte de l'app à l'étape 01, où Awa vient s'ancrer. */
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

  const x = useTransform(() => {
    const l = layout.get();
    const v = p.get();
    const s = testerSpot(l, v, slot, count);
    const a = anchorSpot(l, v);
    const base = s.x - 120 * (1 - enter.get()) + knock.get();
    return isAwa ? base + (a.x - s.x) * anchor.get() : base;
  });
  const y = useTransform(() => {
    const l = layout.get();
    const v = p.get();
    const s = testerSpot(l, v, slot, count);
    return isAwa ? s.y + (anchorSpot(l, v).y - s.y) * anchor.get() : s.y;
  });
  const rotate = useTransform(() => -6 * (1 - enter.get()) + FAN_ROT[slot] * enter.get() * (1 - anchor.get()));
  const leave = useTransform(p, [0.46, 0.49], [1, 0], { clamp: true });
  const scale = useTransform(() => {
    const l = layout.get();
    const base = l.desktop ? Math.max(0.82, l.k) : 0.85;
    return base * (l.desktop ? 1 : 0.94) * (isAwa ? 1 - 0.14 * anchor.get() : 1 - 0.08 * anchor.get());
  });
  const opacity = useTransform(() => enter.get() * leave.get() * (isAwa ? 1 : 1 - 0.6 * anchor.get()));

  return (
    <motion.div className="absolute left-1/2 top-1/2" style={{ x, y, rotate, scale, opacity, zIndex: isAwa ? 2 : 1 }}>
      <div className="relative -ml-[110px] -mt-12 flex h-24 w-[220px] items-center gap-3 rounded-card border border-line bg-surface px-3.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.6)]">
        <JobAvatar size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-ink">{t.name}</p>
          <p className="truncate text-[12.5px] leading-tight text-ink-muted">{t.job}</p>
          <p className="mt-1 font-mono text-[11.5px] leading-none tabular-nums text-ink">
            {t.rating}
            {"tag" in t && <span className="ml-1.5 text-ink-muted">· {t.tag}</span>}
          </p>
        </div>
        {/* Emplacement du tampon MÉTIER VÉRIFIÉ */}
        <motion.span
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
  // Mobile : deux testeurs (Awa, Grâce), empilés sous la carte.
  const order = desktop ? [0, 1, 2] : [0, 2];
  return (
    <>
      {order.map((index, slot) => (
        <TesterCard key={index} index={index} slot={slot} count={order.length} p={p} />
      ))}
    </>
  );
}

/* ---------- Étape 03 : notation dans les deux sens ---------- */

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
  return { dev: { x: -l.vw * 0.3, y: c.y - halfH - 34 }, awa: { x: l.vw * 0.3, y: c.y - halfH - 34 } };
}

const ARC = { duration: 0.72, ease: ease.arc };
const RETURN = { type: "spring", stiffness: 400, damping: 34 } as const;

/** Vol d'une pastille d'un avatar à l'autre : keyframes x/y en 3 points, rotate [-10, 6, 0], scale [1, 1.15, 1]. */
function useFlight(p: MotionValue<number>, progress: MotionValue<number>, from: "dev" | "awa", to: "dev" | "awa", width: number) {
  const { layout } = useStage();
  const stamp = useMotionValue(1);
  const lift = layout.get().desktop ? 46 : 38;
  const pos = useTransform(() => {
    const l = layout.get();
    const s = avatarSpots(l, p.get());
    const a = s[from];
    const b = s[to];
    const lim = l.vw / 2 - width / 2 - 12;
    const clampX = (x: number) => Math.max(-lim, Math.min(lim, x));
    const t = progress.get();
    const xs = [clampX(a.x), (a.x + b.x) / 2, clampX(b.x)];
    // Mobile : la pastille qui va vers Awa se pose sous son avatar, pour ne pas chevaucher l'autre.
    const land = !l.desktop && to === "awa" ? b.y + 42 : b.y - lift;
    const ys = [a.y - lift, Math.min(a.y, b.y) - lift - (l.desktop ? 150 : 24), land];
    return { x: interpolate([0, 0.5, 1], xs)(t), y: interpolate([0, 0.5, 1], ys)(t) };
  });
  const x = useTransform(pos, (v) => v.x);
  const y = useTransform(pos, (v) => v.y);
  const rotate = useTransform(progress, [0, 0.5, 1], [-10, 6, 0]);
  const scale = useTransform(() => interpolate([0, 0.5, 1], [1, 1.15, 1])(progress.get()) * stamp.get());
  return { x, y, rotate, scale, stamp };
}

function Pill({ flight, opacity, children }: { flight: ReturnType<typeof useFlight>; opacity: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div className="absolute left-1/2 top-1/2" style={{ x: flight.x, y: flight.y, rotate: flight.rotate, scale: flight.scale, opacity, zIndex: 3 }}>
      <div className="-translate-x-1/2 -translate-y-1/2">{children}</div>
    </motion.div>
  );
}

/** Pastille de note : « De vers À : note », le mot « vers » remplacé par une flèche SVG. */
export function DirectedRating({ r, strong = false }: { r: { from: string; to: string; value: string }; strong?: boolean }) {
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
  // 4,5 vers 4,6 : seule la décimale roule.
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
      // À l'arrivée : tampon sur la pastille ; 400 ms après, la pastille inverse part.
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

  const spots = useTransform(() => avatarSpots(layout.get(), p.get()));
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
        <motion.div key={av.label} className="absolute left-1/2 top-1/2" style={{ x: av.x, y: av.y, opacity: shown, scale: avatarScale }}>
          <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
            {av.avatar}
            <span className="whitespace-nowrap font-mono text-[11px] leading-none text-ink-muted">
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
