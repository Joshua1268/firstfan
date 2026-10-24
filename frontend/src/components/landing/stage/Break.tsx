"use client";

import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { dur, ease, spring } from "@/lib/motion-tokens";
import { go, useRingRadius, useStage, useThreshold } from "./context";
import { LOOP } from "./copy";
import { BREACH_DEG } from "./layout";
import { useRecess } from "./Loop";

/**
 * Scène B, moment signature (§4) : tension, cassure des arcs en temps réel, passage de la carte par la brèche
 * avec l'onde accent, puis recul de la boucle vers un calque déjà flouté.
 * Ce composant pilote aussi `pass`, `colorOn` et `shake`, lus par la carte.
 */

const CUT_DEG = 18;
const SEPARATION = 7; // chaque moitié : 14px d'écart au total
const SHARDS = [
  { x: 34, y: -48, r: 20 },
  { x: 64, y: -14, r: -35 },
  { x: 6, y: -62, r: 60 },
  { x: 54, y: -40, r: -10 },
];

/** Angle du label posé en haut à l'arrêt de l'anneau. */
const STOP_DEG = 270;

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, d: number) => `${(Math.cos(rad(d)) * r).toFixed(2)} ${(Math.sin(rad(d)) * r).toFixed(2)}`;

/** Deux arcs complémentaires qui se rejoignent à la brèche : A dans le sens horaire, B dans l'autre. */
export function arcPaths(r: number) {
  const b = BREACH_DEG;
  return {
    a: `M ${pt(r, b + 180)} A ${r} ${r} 0 0 1 ${pt(r, b + 270)} A ${r} ${r} 0 0 1 ${pt(r, b + 360)}`,
    b: `M ${pt(r, b + 180)} A ${r} ${r} 0 0 0 ${pt(r, b + 90)} A ${r} ${r} 0 0 0 ${pt(r, b)}`,
    len: Math.PI * r,
  };
}

const tangent = { x: -Math.sin(rad(BREACH_DEG)), y: Math.cos(rad(BREACH_DEG)) };
const CRACK = { type: "spring", ...spring.crack } as const;
const CLOSE = { type: "spring", stiffness: 500, damping: 30 } as const;
const SPLIT = { type: "spring", stiffness: 400, damping: 20 } as const;
const SHARD = { type: "spring", stiffness: 300, damping: 12 } as const;

/** Calque déjà flouté de l'anneau ouvert : rendu une fois, on ne fait que changer son opacité. */
function BlurredRing({ r, opacity }: { r: number; opacity: MotionValue<number> | number }) {
  const { a, b, len } = arcPaths(r);
  const size = 2 * r + 220;
  const off = len * (CUT_DEG / 180);
  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ opacity, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, filter: "blur(4px)", willChange: "opacity" }}
    >
      <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} className="absolute inset-0">
        <g fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeWidth={3} strokeDasharray={`${len} ${len}`} strokeDashoffset={off}>
          <path d={a} transform={`translate(${-tangent.x * SEPARATION} ${-tangent.y * SEPARATION})`} />
          <path d={b} transform={`translate(${tangent.x * SEPARATION} ${tangent.y * SEPARATION})`} />
        </g>
      </svg>
      {/* Comme l'anneau net après la cassure : seul le label du haut (« Personne n'utilise ») reste. */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[18px] font-semibold text-ink"
        style={{ left: size / 2 + Math.cos(rad(STOP_DEG)) * r, top: size / 2 + Math.sin(rad(STOP_DEG)) * r }}
      >
        {LOOP.labels[2]}
      </span>
    </motion.div>
  );
}

export function Break({ p, final = false }: { p: MotionValue<number>; final?: boolean }) {
  const { layout, pass, colorOn, shake, instant, desktop } = useStage();
  const r = useRingRadius();
  const { a, b, len } = arcPaths(r);
  const cut = len * (CUT_DEG / 180);
  const opened = final || p.get() >= 0.185;
  const dash = useMotionValue(opened ? cut : 0);
  const split = useMotionValue(opened ? 1 : 0);
  const burst = useMotionValue(0);
  const burstOpacity = useMotionValue(0);
  const wave = useMotionValue(0);
  const interacted = useRef(false);

  const { scale, sharp, blurred, x: ringX, y: ringY } = useRecess(p);
  // L'onde part du point de franchissement : repère de l'anneau avant son recul.
  const cx = useTransform(() => layout.get().ring.cx);
  const reduce = useReducedMotion() ?? false;
  const { recess } = useStage();
  const cy = useTransform(() => layout.get().ring.cy);
  // Tension : le trait passe de 2 à 3px, par fondu entre deux tracés (aucune animation de stroke-width).
  const thick = useTransform(p, [0.16, 0.185], [0, 1], { clamp: true });
  const thin = useTransform(thick, (v) => 1 - v);
  const aX = useTransform(split, (v) => -tangent.x * SEPARATION * v);
  const aY = useTransform(split, (v) => -tangent.y * SEPARATION * v);
  const bX = useTransform(split, (v) => tangent.x * SEPARATION * v);
  const bY = useTransform(split, (v) => tangent.y * SEPARATION * v);
  const waveScale = wave;
  const waveOpacity = useTransform(wave, [0, 0.02, 1], [0, 0.8, 0]);
  const breach = { x: Math.cos(rad(BREACH_DEG)) * r, y: Math.sin(rad(BREACH_DEG)) * r };

  useEffect(() => {
    const mark = () => (interacted.current = true);
    window.addEventListener("pointerdown", mark, { once: true, passive: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  // 1) Tension : la carte tremble au seuil 0.17.
  useThreshold(p, 0.17, (above, initial) => {
    if (final || initial || instant || !above) return;
    go(shake, [0, -3, 3, -2, 2, 0], { duration: 0.26, ease: "linear" }, false);
  });

  // 2) et 3) Cassure et passage de la carte, joués en temps réel au seuil 0.185 ; 5) réversibles.
  useThreshold(p, 0.185, (above, initial) => {
    if (final) return;
    const now = instant || initial;
    if (above) {
      go(dash, cut, CRACK, now);
      go(split, 1, SPLIT, now);
      go(pass, 1, { duration: dur.slow / 1000 + 0.01, ease: ease.overshoot }, now);
      go(colorOn, 1, { duration: 0.45, ease: ease.outQuint }, now);
      // Une fois la carte passée, la boucle recule et glisse en filigrane (l'écran se libère pour la carte).
      go(recess, 1, { duration: 0.7, delay: 0.35, ease: ease.outQuint }, now);
      if (now) return;
      burst.set(0);
      burstOpacity.set(1);
      go(burst, 1, SHARD, false);
      go(burstOpacity, 0, { duration: 0.5, delay: 0.15, ease: "easeOut" }, false);
      // Retour haptique : mobile, après une interaction, jamais en reduced-motion (§4).
      if (!reduce && !desktop && interacted.current && "vibrate" in navigator) navigator.vibrate?.(12);
    } else {
      go(dash, 0, CLOSE, now);
      go(split, 0, CLOSE, now);
      go(pass, 0, { duration: 0.45, ease: ease.outQuint }, now);
      go(colorOn, 0, { duration: 0.45, ease: ease.outQuint }, now);
      go(recess, 0, CLOSE, now);
      burst.stop();
      burstOpacity.set(0);
      wave.stop();
      wave.set(0);
    }
  });

  // Onde accent quand la carte franchit 45 % du trajet (à l'aller seulement).
  const prevPass = useRef(pass.get());
  useMotionValueEvent(pass, "change", (v) => {
    const was = prevPass.current;
    prevPass.current = v;
    if (instant || final || !(was < 0.45 && v >= 0.45)) return;
    wave.set(0);
    go(wave, 1, { duration: 0.5, ease: ease.outExpo }, false);
  });

  const size = 2 * r + 40;
  return (
    <>
      <motion.div className="absolute left-1/2 top-1/2 will-change-transform" style={{ x: ringX, y: ringY, scale }}>
        <BlurredRing r={r} opacity={final ? 0 : blurred} />
        <motion.svg
          width={size}
          height={size}
          viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
          className="absolute left-0 top-0 overflow-visible"
          style={{ marginLeft: -size / 2, marginTop: -size / 2, opacity: final ? 1 : sharp }}
        >
          <g fill="none" stroke="var(--ink)" strokeOpacity={0.4} strokeLinecap="round" strokeDasharray={`${len} ${len}`}>
            <motion.g style={{ x: aX, y: aY }}>
              <motion.path data-arc="a" d={a} strokeWidth={2} style={{ strokeDashoffset: dash, opacity: thin }} />
              <motion.path d={a} strokeWidth={3} style={{ strokeDashoffset: dash, opacity: thick }} />
            </motion.g>
            <motion.g style={{ x: bX, y: bY }}>
              <motion.path d={b} strokeWidth={2} style={{ strokeDashoffset: dash, opacity: thin }} />
              <motion.path d={b} strokeWidth={3} style={{ strokeDashoffset: dash, opacity: thick }} />
            </motion.g>
          </g>
          {!final && (
            <g transform={`translate(${breach.x} ${breach.y})`}>
              {SHARDS.map((s, i) => (
                <Shard key={i} s={s} burst={burst} opacity={burstOpacity} />
              ))}
            </g>
          )}
        </motion.svg>
      </motion.div>
      {!final && (
        <motion.div className="pointer-events-none absolute left-1/2 top-1/2" style={{ x: cx, y: cy }}>
          <motion.svg
            width="284"
            height="284"
            viewBox="-142 -142 284 284"
            className="absolute"
            style={{ left: breach.x - 142, top: breach.y - 142, scale: waveScale, opacity: waveOpacity }}
          >
            <circle r="140" fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </motion.svg>
        </motion.div>
      )}
    </>
  );
}

function Shard({ s, burst, opacity }: { s: (typeof SHARDS)[number]; burst: MotionValue<number>; opacity: MotionValue<number> }) {
  const x = useTransform(burst, (v) => s.x * v);
  const y = useTransform(burst, (v) => s.y * v);
  return (
    <motion.rect x={-3} y={-1} width={6} height={2} fill="var(--ink)" style={{ x, y, rotate: s.r, opacity }} />
  );
}
