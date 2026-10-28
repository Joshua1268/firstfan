"use client";

import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { dur, spring } from "@/lib/motion-tokens";
import {
  ArrowIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  PauseIcon,
  PhoneIcon,
  PlayIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
} from "@/ui/icons";
import { ProofSticker, type ProofKind } from "./ProofSticker";
import {
  containerCls,
  h2Cls,
  Kicker,
  leadCls,
  riseVariants,
  STAMP_SPRING,
  useMediaQuery,
  usePageVisible,
  useReveal,
  useReduce,
} from "./reveal";

// The phone demo loops only while visible, not hovered and not paused (WCAG 2.2.2).

const BULLETS = [
  { icon: ShieldIcon, text: "Ton métier est vérifié une fois. Ton profil parle pour toi." },
  { icon: PhoneIcon, text: "Tu choisis les missions qui te parlent." },
  { icon: StarIcon, text: "Tu notes le dev aussi. Ta voix compte. On est ensemble." },
  { icon: SparkIcon, text: "Tu découvres des outils faits pour ton travail. Si tu les adoptes, tu as des avantages." },
] as const;

const MISSIONS = [
  { title: "Tester une app de facturation", time: "Environ 25 min", job: "Pour comptables" },
  { title: "Tester une app de gestion de stock", time: "Environ 15 min", job: "Pour commerçantes" },
  { title: "Tester une app de livraison", time: "Environ 20 min", job: "Pour livreurs" },
] as const;

const PAID = "Payé après validation";
const WALLETS = "Wave · Orange Money · MTN MoMo";

const STICKERS: { text: string; kind: ProofKind; r: number; pos: string }[] = [
  // They overlap the phone frame, never the screen text.
  { text: PAID, kind: "check", r: -6, pos: "-left-[194px] top-[64px]" },
  { text: "4,8 / 5", kind: "rating", r: 8, pos: "-right-[64px] top-[300px]" },
  { text: "Le dev aussi est noté", kind: "pill", r: -4, pos: "-left-[190px] top-[452px]" },
];

// Duration of each loop state, in ms.
const HOLD = [2400, 2000, 2400] as const;
const LIFT = { type: "spring", ...spring.lift } as const;
const SLIDE = { type: "spring", stiffness: 320, damping: 32 } as const;
const DROP = { type: "spring", stiffness: 500, damping: 20 } as const;

type Screen = 0 | 1 | 2;

function MissionMeta({ time, job }: { time: string; job: string }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] leading-snug text-ink-muted">
      <span>{time}</span>
      <span aria-hidden="true">·</span>
      <span>{job}</span>
    </p>
  );
}

function PaidBadge() {
  return (
    <span className="mt-2 inline-flex items-center gap-1 rounded-pill bg-accent/[0.14] px-2 py-1 text-[11px] font-semibold leading-none text-accent">
      <CheckIcon size={12} strokeWidth={2.25} />
      {PAID}
    </span>
  );
}

function MissionList({ ripple, cycle }: { ripple: boolean; cycle: number }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {MISSIONS.map((m, i) => (
        <li key={m.title} className="relative overflow-hidden rounded-[16px] border border-line bg-surface p-3.5">
          <p className="text-[14px] font-semibold leading-snug text-ink">{m.title}</p>
          <MissionMeta time={m.time} job={m.job} />
          {i === 0 && <PaidBadge />}
          {i === 0 && ripple && (
            <motion.span
              key={cycle}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function StatusBar() {
  return (
    <div
      aria-hidden="true"
      className="flex h-7 items-center justify-between px-5 pt-1 font-mono text-[11px] text-ink-muted"
    >
      <span>14:32</span>
      <span className="h-[18px] w-[72px] rounded-pill bg-[#000]" />
      <span className="flex items-center gap-1">
        <span className="h-2 w-3.5 rounded-[2px] border border-ink-muted" />
      </span>
    </div>
  );
}

function PhoneScreens({ screen, cycle, still }: { screen: Screen; cycle: number; still: boolean }) {
  const back = screen === 0;
  return (
    <div className="absolute inset-[8px] overflow-hidden rounded-[32px] bg-bg">
      {/* State 1: mission list (always underneath). */}
      <div data-phone-screen="list" aria-hidden={screen !== 0} className="absolute inset-0 flex flex-col">
        <StatusBar />
        <div className="flex flex-1 flex-col px-4 pt-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">{PRODUCT_NAME}</p>
          <p className="mt-1 font-display text-[24px] font-extrabold leading-none text-ink [font-variation-settings:'wdth'_75]">
            Missions pour toi
          </p>
          <div className="mt-4">
            <MissionList ripple={screen === 1 && !still} cycle={cycle} />
          </div>
          <p className="mt-auto px-2 pb-5 text-center font-mono text-[10px] leading-snug text-ink-muted">{WALLETS}</p>
        </div>
      </div>

      {/* State 2: the open mission slides in. */}
      <motion.div
        data-phone-screen="mission"
        aria-hidden={screen !== 1}
        className="absolute inset-0 flex flex-col bg-bg"
        initial={false}
        animate={{ x: screen === 0 ? "100%" : "0%", opacity: back ? 0 : 1 }}
        transition={
          back
            ? { opacity: { duration: 0.4 }, x: { delay: 0.4, duration: 0 } }
            : { x: { ...SLIDE, delay: still ? 0 : 0.3 }, opacity: { duration: 0 } }
        }
      >
        <StatusBar />
        <div className="flex flex-1 flex-col px-4 pt-3">
          <p className="flex items-center gap-1 text-[12px] text-ink-muted">
            <ChevronIcon size={14} className="rotate-90" />
            Missions
          </p>
          <p className="mt-3 font-display text-[24px] font-extrabold leading-[1.02] text-ink [font-variation-settings:'wdth'_75]">
            {MISSIONS[0].title}
          </p>
          <ul className="mt-4 flex flex-col gap-2.5 text-[13px] text-ink">
            <li className="flex items-center gap-2.5">
              <ClockIcon size={18} className="text-ink-muted" />
              {MISSIONS[0].time}
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldIcon size={18} className="text-ink-muted" />
              {MISSIONS[0].job}
            </li>
            <li className="flex items-center gap-2.5">
              <CheckIcon size={18} className="text-accent" />
              {PAID}
            </li>
          </ul>
          <div className="mt-4 rounded-[14px] border border-line bg-surface p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">Paiement mobile money</p>
            <p className="mt-1 text-[13px] text-ink">{WALLETS}</p>
          </div>
          <button
            type="button"
            tabIndex={-1}
            aria-disabled="true"
            className="mb-5 mt-auto h-11 rounded-pill bg-accent text-[14px] font-semibold text-accent-ink"
          >
            Commencer la mission
          </button>
        </div>
      </motion.div>

      {/* State 3: mission approved, no amount shown. */}
      <motion.div
        data-phone-screen="done"
        aria-hidden={screen !== 2}
        className="absolute inset-0 flex flex-col bg-bg"
        initial={false}
        animate={{ opacity: screen === 2 ? 1 : 0 }}
        transition={{ duration: still ? 0 : back ? 0.4 : dur.fast / 1000 }}
      >
        <StatusBar />
        <motion.div
          className="absolute inset-x-3 top-9 z-10 flex items-center gap-3 rounded-[16px] border border-line bg-surface px-3.5 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,.7)]"
          initial={false}
          animate={screen === 2 ? { y: 0, opacity: 1 } : { y: -40, opacity: 0 }}
          transition={
            screen === 2 && !still
              ? { ...DROP, delay: 0.85, opacity: { duration: 0.12, delay: 0.85 } }
              : { duration: 0, delay: back ? 0.4 : 0 }
          }
        >
          <span className="flex size-8 flex-none items-center justify-center rounded-full bg-accent text-accent-ink">
            <CheckIcon size={16} strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-tight text-ink">Paiement envoyé</span>
            <span className="block text-[11px] leading-tight text-ink-muted">Mobile money · à l&apos;instant</span>
          </span>
        </motion.div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="relative flex size-24 items-center justify-center">
            <svg viewBox="0 0 96 96" className="absolute inset-0 text-accent" fill="none" aria-hidden="true">
              <circle cx="48" cy="48" r="44" stroke="var(--line)" strokeWidth="1.5" />
              <motion.path
                d="M30 50l12 12 25-27"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: screen === 2 ? 1 : 0, opacity: screen === 2 ? 1 : 0 }}
                transition={
                  screen === 2 && !still
                    ? {
                        pathLength: { duration: dur.medium / 1000 - 0.02, delay: 0.15, ease: [0.65, 0, 0.35, 1] },
                        opacity: { duration: 0.01, delay: 0.15 },
                      }
                    : { duration: 0, delay: back ? 0.4 : 0 }
                }
              />
            </svg>
          </span>
          <p className="mt-5 font-display text-[28px] font-extrabold leading-none text-ink [font-variation-settings:'wdth'_75]">
            Mission validée
          </p>
          <p className="mt-2 text-[13px] leading-snug text-ink-muted">{MISSIONS[0].title}</p>
          <motion.span
            className="relative mt-5 inline-flex items-center gap-1.5 rounded-pill border-2 border-accent px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-accent"
            initial={false}
            animate={screen === 2 ? { scale: 1, rotate: -6, opacity: 1 } : { scale: 1.4, rotate: -14, opacity: 0 }}
            transition={
              screen === 2 && !still
                ? { ...STAMP_SPRING, delay: 0.55, opacity: { duration: dur.instant / 1000, delay: 0.55 } }
                : { duration: 0, delay: back ? 0.4 : 0 }
            }
          >
            Validé
            {!still && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[-6px] rounded-pill border-2 border-accent"
                initial={false}
                animate={screen === 2 ? { scale: [0.8, 1.5], opacity: [0.9, 0] } : { scale: 0.8, opacity: 0 }}
                transition={
                  screen === 2 ? { duration: dur.medium / 1000, ease: "easeOut", delay: 0.6 } : { duration: 0 }
                }
              />
            )}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}

export function PhoneDemo() {
  const reduce = useReduce();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const visible = usePageVisible();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const fine = useMediaQuery("(pointer: fine)");
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [screen, setScreen] = useState<Screen>(0);
  const [cycle, setCycle] = useState(0);
  const shown: Screen = reduce ? 2 : screen;
  const running = !reduce && inView && visible && !paused && !hold;

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      setScreen((s) => ((s + 1) % 3) as Screen);
      if (screen === 2) setCycle((c) => c + 1);
    }, HOLD[screen]);
    return () => window.clearTimeout(t);
  }, [running, screen]);

  // Tilt follows the mouse on fine pointers.
  const tilt = desktop && fine && !reduce;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, spring.pointer);
  const sy = useSpring(my, spring.pointer);
  const rotateY = useTransform(sx, (v) => v * 4);
  const rotateX = useTransform(sy, (v) => -v * 4);
  useEffect(() => {
    if (!tilt) return;
    const onMove = (e: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      mx.set(Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / r.width) * 2)));
      my.set(Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height / 2)) / r.height) * 2)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [tilt, mx, my]);

  const reveal = useReveal(0.35);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        ref={root}
        {...reveal}
        role="group"
        aria-roledescription="démonstration"
        aria-label="Démonstration de l'app testeur : liste de missions, mission ouverte, puis mission validée et paiement envoyé."
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={() => setHold(false)}
        className="relative [perspective:1200px]"
      >
        <motion.div
          data-reveal=""
          variants={{
            hidden: { y: 60, opacity: 0 },
            show: { y: 0, opacity: 1, transition: { ...LIFT, opacity: { duration: 0.3 } } },
          }}
        >
          <div className="pro-phone-tilt [transform-style:preserve-3d]">
            <motion.div
              style={tilt ? { rotateY, rotateX } : undefined}
              className="relative [transform-style:preserve-3d]"
            >
              {[1, 2].map((n) => (
                <motion.div
                  key={n}
                  aria-hidden="true"
                  data-reveal=""
                  className="pro-ghost absolute inset-0 hidden rounded-[var(--radius-phone)] border border-line bg-surface lg:block"
                  variants={{
                    hidden: { opacity: 0, x: 0, z: 0 },
                    show: {
                      opacity: n === 1 ? 0.5 : 0.25,
                      x: n * 26,
                      z: -40 * n,
                      transition: { type: "spring", ...spring.lift, delay: 0.25 + n * 0.12 },
                    },
                  }}
                />
              ))}
              <div className="relative aspect-[1/2] w-[78vw] max-w-[300px] rounded-[var(--radius-phone)] bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,.6),inset_0_0_0_1px_rgba(242,237,227,.06)] lg:w-[300px]">
                <PhoneScreens screen={shown} cycle={cycle} still={reduce} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <Stickers around />
      </motion.div>

      {!reduce && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-pill px-4 font-mono text-[12px] text-ink-muted transition-colors duration-150 hover:text-ink"
        >
          {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          {paused ? "Relancer" : "Mettre en pause l'animation"}
        </button>
      )}

      <div data-static-missions="" className="pro-static-missions mt-8 w-full max-w-[340px]">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-muted">Missions pour toi</p>
        <MissionList ripple={false} cycle={0} />
      </div>
    </div>
  );
}

// Around the phone on desktop, in a row below it on mobile.
function Stickers({ around = false }: { around?: boolean }) {
  const reveal = useReveal(0.35);
  return (
    <motion.div
      {...reveal}
      aria-hidden="true"
      className={
        around
          ? "pointer-events-none absolute inset-0 hidden xl:block"
          : "mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-5 xl:hidden"
      }
    >
      {STICKERS.map((s, i) => (
        <motion.span
          key={s.text}
          data-reveal=""
          className={`inline-flex ${around ? `absolute ${s.pos}` : ""}`}
          variants={{
            hidden: { scale: 1.4, rotate: s.r - 8, opacity: 0 },
            show: {
              scale: 1,
              rotate: s.r,
              opacity: 1,
              transition: {
                ...STAMP_SPRING,
                delay: 0.45 + i * 0.06,
                opacity: { duration: dur.instant / 1000, delay: 0.45 + i * 0.06 },
              },
            },
          }}
          style={{ rotate: s.r }}
        >
          <ProofSticker text={s.text} kind={s.kind} />
        </motion.span>
      ))}
    </motion.div>
  );
}

export function ProSection() {
  const reveal = useReveal(0.3);
  const bullet = riseVariants(16, spring.soft, 0.08);
  return (
    <section id="pro" aria-labelledby="pro-title" className="relative overflow-x-clip py-[var(--section-y)]">
      <div className={`${containerCls} grid gap-y-12 lg:grid-cols-12 lg:gap-x-[var(--grid-gutter)] lg:gap-y-10`}>
        <div className="lg:col-span-6 lg:row-start-1">
          <Kicker>Et toi, le pro</Kicker>
          <h2 id="pro-title" className={`${h2Cls} mt-4`}>
            Ton métier vaut de l&apos;argent. Ici, il est payé.
          </h2>
          <p className={`${leadCls} mt-6`}>
            T&apos;es comptable, livreur, restauratrice, commerçante&nbsp;? Les devs construisent des outils pour ton
            travail, et ils ont besoin de ton œil. Tu testes depuis ton téléphone, tu dis ce que tu penses vraiment, et
            tu es payé après validation.
          </p>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:flex lg:items-center lg:justify-center lg:py-10">
          <PhoneDemo />
          <Stickers />
        </div>

        <div className="lg:col-span-6 lg:row-start-2">
          <motion.ul {...reveal} className="flex flex-col gap-5">
            {BULLETS.map(({ icon: Icon, text }, i) => (
              <motion.li key={text} data-reveal="" custom={i} variants={bullet} className="flex items-start gap-4">
                <span className="flex size-11 flex-none items-center justify-center rounded-full border border-line text-ink">
                  <Icon size={22} />
                </span>
                <span className="pt-2.5 text-[17px] leading-snug text-ink">{text}</span>
              </motion.li>
            ))}
          </motion.ul>
          <div className="mt-10 flex flex-col gap-3 md:items-start">
            {/* Links to /testeurs without the lime reserved for the dev action. */}
            <Link
              href="/testeurs"
              prefetch={false}
              className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill border border-ink/70 px-7 text-[16px] font-semibold leading-none text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.07] active:scale-[0.97] md:w-auto"
            >
              Devenir testeur
              <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
            <p className="text-center text-[14px] leading-snug text-ink-muted md:text-left">
              Paiement, vérification, confidentialité : tout est sur la page testeurs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
