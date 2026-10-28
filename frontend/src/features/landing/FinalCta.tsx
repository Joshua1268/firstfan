"use client";

import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring, type Variants } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { dur, ease, spring } from "@/lib/motion-tokens";
import { ArrowIcon, CheckIcon } from "@/ui/icons";
import { ProofSticker, type ProofKind } from "./ProofSticker";
import { containerCls, STAMP_SPRING, useMediaQuery, useReveal, useReduce } from "./reveal";

// The mobile CTA bar hides over this section (#cta-final).

const WORDS = ["Arrête", "de", "recommencer", "la", "boucle."] as const;

// `m`: kept on mobile.
const BOARD: { text: string; kind: ProofKind; r: number; side: -1 | 1; m?: boolean }[] = [
  { text: "Comptable vérifiée", kind: "check", r: -4, side: -1, m: true },
  { text: "14 captures horodatées", kind: "ticket", r: 3, side: -1 },
  { text: "Antériorité prouvée", kind: "pill", r: -3, side: -1, m: true },
  { text: "Restauratrice · Cocody", kind: "tag", r: 2, side: -1 },
  { text: "4,8 / 5", kind: "rating", r: 6, side: 1, m: true },
  { text: "Payé après validation", kind: "check", r: -5, side: 1 },
  { text: "Toujours là à J7", kind: "check", r: 4, side: 1, m: true },
  { text: "Le dev aussi est noté", kind: "pill", r: -2, side: 1 },
];

const PROOFS = [
  "Métier vérifié",
  "Parcours guidé 4/4",
  "Capture 14:32:07",
  "Note du dev : 4,6 / 5",
  "Encore là à J30",
] as const;

const RING_R = 46;
const RING_OPEN = 0.88;
// An SVG circle starts at 3 o'clock: rotate it so the gap faces the CTAs.
const RING_ROTATE = 90 + ((1 - RING_OPEN) * 360) / 2;

function Ring() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute left-1/2 top-[48%] w-[150vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 md:w-[110vw]"
      fill="none"
    >
      <motion.circle
        data-reveal-path=""
        cx="50"
        cy="50"
        r={RING_R}
        stroke="var(--watermark)"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform={`rotate(${RING_ROTATE} 50 50)`}
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: RING_OPEN,
            opacity: 1,
            transition: { pathLength: { duration: dur.story / 1000, ease: ease.inOut }, opacity: { duration: 0.01 } },
          },
        }}
      />
    </svg>
  );
}

// Two lines on desktop so the CTAs stay above the fold.
function Title() {
  const reduce = useReduce();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [state, setState] = useState<"idle" | "armed" | "play">("idle");
  useEffect(() => {
    if (reduce) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the mask only exists with JS, off screen
    setState((s) => (s === "idle" ? (inView ? "idle" : "armed") : s === "armed" && inView ? "play" : s));
  }, [reduce, inView]);
  return (
    <h2
      ref={ref}
      id="cta-final-title"
      data-state={state}
      className="cta-title text-center font-display text-[clamp(52px,14vw,96px)] font-extrabold uppercase leading-[var(--leading-h1)] tracking-[var(--tracking-h1)] text-ink [font-variation-settings:'wdth'_62] md:text-[length:min(var(--text-h1),11.5vw)] lg:text-[length:min(var(--text-h1),8vw,112px)]"
    >
      {WORDS.map((w, i) => (
        <span key={w}>
          <span className="hero-mask">
            <span className="cta-word inline-block" style={{ ["--i" as string]: i }}>
              {w}
            </span>
          </span>
          {i < WORDS.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

function AppCard() {
  return (
    <div className="relative w-full max-w-[320px] rounded-[var(--radius-card)] border border-line bg-surface p-5 text-left shadow-[0_40px_80px_-20px_rgba(0,0,0,.6),inset_0_0_0_1px_rgba(242,237,227,.06)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">monapp.ci</p>
      <p className="mt-1 text-[16px] font-semibold text-ink">MonApp · MVP v0.3</p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Dossier de preuves</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {PROOFS.map((p) => (
          <li key={p} className="flex items-center gap-2 text-[14px] leading-snug text-ink">
            <CheckIcon size={16} strokeWidth={2} className="flex-none text-accent" />
            <span className="tabular-nums">{p}</span>
          </li>
        ))}
      </ul>
      <motion.span
        data-reveal=""
        className="absolute -right-4 -top-5 inline-flex items-center rounded-[10px] border-2 border-accent bg-bg px-3 py-1.5 font-mono text-[13px] font-medium uppercase tracking-[0.16em] text-accent"
        variants={{
          hidden: { scale: 1.6, opacity: 0, rotate: -18 },
          show: {
            scale: 1,
            opacity: 1,
            rotate: -8,
            transition: { ...STAMP_SPRING, delay: 0.75, opacity: { duration: dur.instant / 1000, delay: 0.75 } },
          },
        }}
      >
        Validé
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-6px] rounded-[14px] border-2 border-accent"
          variants={{
            hidden: { scale: 0.8, opacity: 0 },
            show: {
              scale: [0.8, 1.4],
              opacity: [0.9, 0],
              transition: { duration: dur.medium / 1000, ease: "easeOut", delay: 0.8 },
            },
          }}
        />
      </motion.span>
    </div>
  );
}

function boardVariants(side: -1 | 1, i: number, r: number): Variants {
  return {
    hidden: { x: `${side * 40}vw`, y: `${(i % 2 ? 1 : -1) * 8}vw`, opacity: 0, rotate: r * 3 },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      rotate: r,
      transition: {
        type: "spring",
        stiffness: 140,
        damping: 18,
        delay: 0.2 + i * 0.06,
        opacity: { duration: 0.2, delay: 0.2 + i * 0.06 },
      },
    },
  };
}

function Board({ side }: { side: -1 | 1 }) {
  const items = BOARD.map((b, i) => ({ ...b, i })).filter((b) => b.side === side);
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 place-items-center gap-x-3 gap-y-6 lg:grid-cols-1 lg:gap-y-7">
      {items.map((b) => (
        <motion.li
          key={b.text}
          data-reveal=""
          variants={boardVariants(side, b.i, b.r)}
          className={b.m ? "" : "hidden lg:block"}
        >
          <ProofSticker text={b.text} kind={b.kind} />
        </motion.li>
      ))}
    </ul>
  );
}

// Light magnetic pull on fine pointers.
function MagneticCta() {
  const fine = useMediaQuery("(pointer: fine)");
  const reduce = useReduce();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.magnet);
  const sy = useSpring(y, spring.magnet);
  const on = fine && !reduce;
  const move = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!on) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 6);
    y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 6);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    // Motion makes whileTap elements focusable; only the link should be a tab stop.
    <motion.span
      tabIndex={-1}
      style={on ? { x: sx, y: sy } : undefined}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      className="flex w-full md:inline-flex md:w-auto"
    >
      <Link
        href="/inscription?role=dev"
        prefetch={false}
        onPointerMove={move}
        onPointerLeave={leave}
        className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-pill bg-accent px-7 text-[16px] font-semibold leading-none text-accent-ink transition-colors duration-150 hover:bg-accent-press md:w-auto"
      >
        Je suis développeur
        <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-1" />
      </Link>
    </motion.span>
  );
}

function ProCta() {
  return (
    <Link
      href="/testeurs"
      prefetch={false}
      className="flex h-14 w-full items-center justify-center rounded-pill border border-ink/70 px-7 text-[16px] font-semibold leading-none text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.07] active:bg-ink/[0.1] md:w-auto"
    >
      Je teste et je suis rémunéré
    </Link>
  );
}

function CtaRise({
  delay,
  className = "flex",
  children,
}: {
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      data-reveal=""
      className={className.includes("flex") ? className : `flex ${className}`}
      variants={{
        hidden: { y: 24, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 22, delay: 0.3 + delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FinalCta() {
  const head = useReveal(0.6);
  const board = useReveal(0.35);
  const ctas = useReveal(0.5);
  return (
    <section
      id="cta-final"
      aria-labelledby="cta-final-title"
      className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-bg py-[var(--section-y)] lg:pb-8 lg:pt-[120px]"
    >
      <motion.div {...head} className="absolute inset-0">
        <Ring />
      </motion.div>
      <div className={`${containerCls} relative flex flex-col items-center`}>
        <Title />
        <p className="mt-6 max-w-[46ch] text-center lg:mt-4 text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink-muted">
          Ton app mérite mieux que «&nbsp;c&apos;est super&nbsp;». Ton expertise mérite d&apos;être payée.
        </p>

        <motion.div
          {...board}
          className="mt-12 grid w-full max-w-[1080px] items-center gap-y-10 md:mt-16 lg:mt-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-10"
        >
          <div className="order-2 lg:order-1">
            <Board side={-1} />
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <AppCard />
          </div>
          <div className="order-3">
            <Board side={1} />
          </div>
        </motion.div>

        <motion.div {...ctas} className="mt-12 flex w-full flex-col gap-3 md:mt-14 md:w-auto md:flex-row lg:mt-10">
          {/* The dev action stays first; testers are sent to their own page. */}
          <CtaRise delay={0}>
            <MagneticCta />
          </CtaRise>
          <CtaRise delay={0.06}>
            <ProCta />
          </CtaRise>
        </motion.div>
      </div>
    </section>
  );
}
