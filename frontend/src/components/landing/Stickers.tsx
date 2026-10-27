"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
} from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { dur, spring } from "@/lib/motion-tokens";
import type { Camp } from "./Hero";
import { CheckIcon, StarIcon } from "./icons";

type Shape = "pill-check" | "circle-star" | "folded-check" | "seal" | "pill" | "tag" | "ticket" | "stamp";
type Placement = "title" | "cta" | "bottom";
type Slot = { left: string; top: string };

type StickerDef = {
  n: number;
  text: string;
  camp: Camp;
  shape: Shape;
  accent: boolean;
  d: number;
  /** Rotation finale (degrés). */
  r: number;
  /**
   * Position desktop (>= 1280px) : `title` en % du bloc H1 (qui suit la largeur), `cta` par rapport à la
   * colonne des CTA. `compact` recalibre la même position entre 1024 et 1279px.
   */
  desktop: { layer: "title" | "cta"; compact: Slot } & Slot;
  /** Position mobile (2 autocollants) dans la zone réservée sous le CTA. */
  mobile?: { zone: "bottom" } & Slot;
};

// Hero allégé : 3 autocollants sur desktop, qui racontent l'histoire dans l'ordre de lecture
// (qui teste, la preuve, l'adoption) ; un seul en accent. 2 sur mobile, posés sous le CTA pour ne jamais
// concurrencer le H1. Les positions respectent les zones d'exclusion (aucun ne recouvre le H1, le texte ni le CTA)
// et sont vérifiées par e2e/landing.spec.ts.
const STICKERS: StickerDef[] = [
  {
    n: 1,
    text: "Comptable vérifiée",
    camp: "dev",
    shape: "pill-check",
    accent: true,
    d: 0.9,
    r: -6,
    desktop: { layer: "title", left: "77.8%", top: "6%", compact: { left: "77.8%", top: "8.8%" } },
    mobile: { zone: "bottom", left: "0%", top: "14%" },
  },
  {
    n: 2,
    text: "14 captures horodatées",
    camp: "dev",
    shape: "ticket",
    accent: false,
    d: 0.7,
    r: -7,
    desktop: { layer: "title", left: "46.8%", top: "75.7%", compact: { left: "45.5%", top: "80.6%" } },
  },
  {
    n: 3,
    text: "Toujours là à J7",
    camp: "dev",
    shape: "pill-check",
    accent: false,
    d: 0.5,
    r: 5,
    desktop: { layer: "cta", left: "72%", top: "18%", compact: { left: "70%", top: "22%" } },
    mobile: { zone: "bottom", left: "52%", top: "30%" },
  },
];

// Ordre de tamponnage : de haut en bas, dans l'ordre de lecture.
const ORDER_DESKTOP = [1, 2, 3];
const ORDER_MOBILE = [1, 3];

const STAMP_DELAY = 0.8;
const STAMP_STAGGER = 0.06;

/**
 * Le calendrier du §2 se compte depuis le début de la navigation, pas depuis le montage
 * (ce composant arrive après l'hydratation, par next/dynamic). Si le chargement est en retard,
 * on garde l'écart de 60 ms entre deux tampons.
 */
function sinceNavigation() {
  return typeof performance === "undefined" ? 0 : performance.now() / 1000;
}

const SPRING_STAMP = { type: "spring", ...spring.stamp } as const;
const SPRING_CAMP = { type: "spring", stiffness: 260, damping: 26 } as const;
const SPRING_HOVER = { type: "spring", stiffness: 400, damping: 25 } as const;
const SPRING_FOLD = { type: "spring", stiffness: 400, damping: 22 } as const;

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function Stickers({
  placement,
  camp,
  progress,
}: {
  placement: Placement;
  camp: Camp | null;
  progress: MotionValue<number>;
}) {
  // Tablettes (< 1024px) : disposition mobile à 2 autocollants dans la zone réservée sous le CTA.
  const desktop = useMedia("(min-width: 1024px)");
  const wide = useMedia("(min-width: 1280px)");
  const fine = useMedia("(pointer: fine)");
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLDivElement>(null);
  const [baseDelay] = useState(() => Math.max(0, STAMP_DELAY - sinceNavigation()));

  const isLayer = placement === "title" || placement === "cta";
  const active = isLayer ? desktop : !desktop;
  const parallax = isLayer && fine && !reduce;

  // Parallaxe souris : mx, my dans [-1, 1], lissés par useSpring 120/20.
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, spring.pointer);
  const my = useSpring(myRaw, spring.pointer);

  useEffect(() => {
    if (!active || !parallax) return;
    const onMove = (e: PointerEvent) => {
      mxRaw.set((e.clientX / window.innerWidth) * 2 - 1);
      myRaw.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    // La respiration commence à 1300 ms, une fois les tampons posés (§2).
    const t = window.setTimeout(
      () => window.addEventListener("pointermove", onMove, { passive: true }),
      Math.max(0, 1300 - sinceNavigation() * 1000),
    );
    // Vernis : une écriture de variable CSS par frame, sans re-render React.
    const off = mx.on("change", (v) => root.current?.style.setProperty("--sheen-x", `${(-20 * v).toFixed(2)}%`));
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointermove", onMove);
      off();
    };
  }, [active, parallax, mx, mxRaw, myRaw]);

  if (!active) return null;

  const order = isLayer ? ORDER_DESKTOP : ORDER_MOBILE;
  const defs = STICKERS.filter((s) => (isLayer ? s.desktop.layer === placement : s.mobile?.zone === placement));

  return (
    // Décoratifs pour les technologies d'assistance : ces preuves sont reprises en texte dans les sections suivantes.
    <div ref={root} aria-hidden="true" className="absolute inset-0" style={{ ["--sheen-x" as string]: "0%" }}>
      {defs.map((def) => (
        <Sticker
          key={def.n}
          // Sur mobile, les autocollants sont sous le CTA lime : tous à l'encre, pour ne pas lui voler l'œil.
          def={isLayer ? def : { ...def, accent: false }}
          slot={isLayer ? (wide ? def.desktop : def.desktop.compact) : def.mobile!}
          rank={order.indexOf(def.n)}
          baseDelay={baseDelay}
          camp={camp}
          mx={mx}
          my={my}
          progress={progress}
          reduce={reduce}
          amplitude={isLayer ? 1 : 0.5}
          interactive={isLayer && fine}
        />
      ))}
    </div>
  );
}

function Sticker({
  def,
  slot,
  rank,
  baseDelay,
  camp,
  mx,
  my,
  progress,
  reduce,
  amplitude,
  interactive,
}: {
  def: StickerDef;
  slot: Slot;
  rank: number;
  baseDelay: number;
  camp: Camp | null;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  progress: MotionValue<number>;
  reduce: boolean;
  amplitude: number;
  interactive: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [stamps, setStamps] = useState(0);
  const { d, r } = def;

  // Profondeur : parallaxe souris + scroll lié (amplitude divisée par deux sur mobile).
  const x = useTransform(mx, (v) => v * d * 22);
  const y = useTransform([my, progress], ([m, p]: number[]) => m * d * 16 - p * d * 160 * amplitude);
  const rotate = useTransform([mx, progress], ([m, p]: number[]) => m * d * 3 + p * d * 6 * amplitude);

  const delay = stamps === 0 ? baseDelay + rank * STAMP_STAGGER : 0;
  const from = rank % 2 === 0 ? -14 : 14;

  const stampTransition: Transition = {
    scale: { ...SPRING_STAMP, delay },
    rotate: { ...SPRING_STAMP, delay },
    opacity: { duration: dur.instant / 1000, ease: "linear", delay },
  };

  const campState =
    camp === null
      ? { scale: 1, y: 0, opacity: 1 }
      : camp === def.camp
        ? { scale: 1.07, y: -6, opacity: 1 }
        : { scale: 0.96, y: 0, opacity: 0.45 };
  const hoverState = hovered ? { scale: 1.07, y: campState.y, opacity: 1, rotate: -r } : { ...campState, rotate: 0 };

  return (
    <div className="absolute" style={{ left: slot.left, top: slot.top }}>
      <motion.div style={{ x: reduce ? 0 : x, y: reduce ? 0 : y, rotate: reduce ? 0 : rotate }}>
        <motion.div
          initial={false}
          animate={hoverState}
          transition={hovered ? SPRING_HOVER : SPRING_CAMP}
          onPointerEnter={interactive ? () => setHovered(true) : undefined}
          onPointerLeave={interactive ? () => setHovered(false) : undefined}
          onClick={() => !reduce && setStamps((s) => s + 1)}
          className="pointer-events-auto cursor-default"
        >
          <motion.div
            key={stamps}
            initial={reduce ? false : { scale: 1.4, rotate: from, opacity: 0 }}
            animate={{ scale: 1, rotate: r, opacity: 1 }}
            transition={stampTransition}
            className="relative"
          >
            <motion.span
              aria-hidden="true"
              className={`sticker-shadow ${shadowShape(def.shape)}`}
              initial={reduce ? false : { opacity: 0, scale: 1.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING_STAMP, delay }}
            />
            <StickerBody def={def} hovered={hovered} />
            {def.accent && !reduce && (
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[85%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
                initial={{ scale: 0.6, opacity: 0.9 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: dur.medium / 1000, ease: "easeOut", delay: delay + 0.05 }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </motion.svg>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function shadowShape(shape: Shape) {
  if (shape === "circle-star" || shape === "seal" || shape === "stamp") return "rounded-full";
  if (shape === "pill-check" || shape === "pill") return "rounded-pill";
  return "rounded-label";
}

const ink = "bg-ink text-bg";
const lime = "bg-accent text-accent-ink";
const textCls =
  "font-sans text-[length:var(--text-sticker)] font-semibold leading-[var(--leading-sticker)] whitespace-nowrap";

function StickerBody({ def, hovered }: { def: StickerDef; hovered: boolean }) {
  const tone = def.accent ? lime : ink;
  const common = { "data-sticker": "", "data-camp": def.camp, "data-accent": def.accent ? "true" : "false" } as const;
  const sheen = <span aria-hidden="true" className="sticker-sheen" />;

  switch (def.shape) {
    case "pill-check":
    case "pill":
      return (
        <div
          {...common}
          className={`${tone} ${textCls} sticker relative inline-flex items-center gap-1.5 rounded-pill px-4 py-2.5`}
        >
          {def.shape === "pill-check" && <CheckIcon size={16} strokeWidth={2.25} />}
          {def.text}
          {sheen}
        </div>
      );
    case "circle-star":
      return (
        <div
          {...common}
          className={`${tone} ${textCls} sticker relative flex size-[72px] flex-col items-center justify-center gap-0.5 rounded-full md:size-[96px]`}
        >
          <StarIcon size={18} fill="currentColor" strokeWidth={1.5} />
          <span className="tabular-nums">{def.text}</span>
          {sheen}
        </div>
      );
    case "folded-check":
      return (
        <div
          {...common}
          className={`sticker relative inline-flex items-center gap-1.5 py-2.5 pl-3.5 pr-7 text-accent-ink ${textCls}`}
        >
          {/* Fond découpé au coin haut droit ; le rabat est un calque à part, non découpé. */}
          <span aria-hidden="true" className="sticker-fold-bg absolute inset-0 overflow-hidden rounded-label bg-accent">
            {sheen}
          </span>
          <CheckIcon size={16} strokeWidth={2.25} className="relative" />
          <span className="relative">{def.text}</span>
          {/* Coin plié : s'ouvre au survol (spring 400/22). */}
          <motion.span
            aria-hidden="true"
            className="sticker-fold"
            initial={false}
            animate={{ rotateZ: hovered ? 18 : 0 }}
            transition={SPRING_FOLD}
          />
        </div>
      );
    case "seal":
      return (
        <div
          {...common}
          className={`${tone} ${textCls} sticker sticker-seal relative flex size-[80px] items-center justify-center text-center md:size-[118px]`}
        >
          <span className="whitespace-normal px-3 leading-[1.05] md:px-4">{def.text}</span>
          {sheen}
        </div>
      );
    case "tag":
      return (
        <div
          {...common}
          className={`${tone} ${textCls} sticker relative inline-flex items-center gap-2.5 rounded-label py-2.5 pl-3 pr-4`}
        >
          <span aria-hidden="true" className="size-2.5 rounded-full bg-bg" />
          {def.text}
          {sheen}
        </div>
      );
    case "ticket":
      return (
        <div
          {...common}
          className={`${tone} ${textCls} sticker sticker-ticket relative inline-flex items-center gap-3 py-3 pl-5 pr-5`}
        >
          <span className="tabular-nums">{def.text}</span>
          {sheen}
        </div>
      );
    case "stamp":
      return (
        <div
          {...common}
          className={`${tone} ${textCls} sticker relative flex size-[100px] items-center justify-center rounded-full text-center md:size-[112px]`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-[6px] rounded-full border-[1.5px] border-dashed border-bg/50"
          />
          <span className="whitespace-normal px-4 leading-[1.1]">{def.text}</span>
          {sheen}
        </div>
      );
  }
}
