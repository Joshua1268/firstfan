"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import type { PublicStats } from "@/lib/stats";
import { ease } from "@/lib/motion-tokens";
import { ArrowIcon, ChevronIcon } from "./icons";
import { heroBadge } from "@/lib/hero-badge";
import { LiveBadge } from "./LiveBadge";

export type Camp = "dev" | "pro";

// Client only; its slots already exist in the HTML, so loading it never shifts the layout.
const loadStickers = () => import("./Stickers").then((m) => m.Stickers);
const Stickers = dynamic(loadStickers, { ssr: false });
// Stamping starts at 800ms: fetch the chunk now instead of waiting for hydration.
if (typeof window !== "undefined") void loadStickers();

function Word({ i, children }: { i: number; children: ReactNode }) {
  return (
    <span className="hero-mask" data-hero-guard>
      <span className="hero-word" style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

// Hand-drawn check above CLIENTS; it must never touch the line above.
function ClientsCheck() {
  const reduce = useReducedMotion();
  // 700ms from navigation start, not from hydration.
  const [delay] = useState(() => Math.max(0, 0.7 - performance.now() / 1000));
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 48"
      fill="none"
      className="pointer-events-none absolute -top-[0.07em] left-[58%] z-10 w-[0.44em] overflow-visible text-accent md:left-[60%] md:w-[0.36em]"
    >
      <motion.path
        d="M6 26c5 3 10 8 14 15C27 25 40 11 58 4"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        // Hidden while pathLength is 0, otherwise the round caps draw two dots.
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                pathLength: { delay, duration: 0.38, ease: ease.outExpo },
                opacity: { delay, duration: 0.01 },
              }
        }
      />
    </svg>
  );
}

const ctaBase =
  "group h-14 w-full items-center justify-center gap-2.5 rounded-pill px-7 text-[16px] font-semibold leading-none transition-colors duration-150 md:w-auto";

export function Hero({ stats }: { stats: PublicStats | null }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [camp, setCamp] = useState<Camp | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const h1Y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const h1Opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.25]);

  return (
    <section
      id="hero"
      ref={ref}
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col overflow-x-clip pt-16"
    >
      <div className="relative mx-auto flex w-full max-w-[calc(var(--grid-max)+2*var(--grid-margin))] flex-1 flex-col px-[var(--grid-margin)] pb-6 md:justify-center md:pb-24">
        <p
          data-hero-guard
          className="hero-lift-12 mt-8 text-balance text-center font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted md:mt-0 md:self-start md:text-left"
        >
          Pour les devs qui ont un MVP et zéro vrai utilisateur
        </p>

        {/* The H1 uses container units and title stickers use % of this block, so both follow every width. */}
        <div className="relative mt-3 [container-type:inline-size] md:mt-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
            <Stickers placement="title" camp={camp} progress={scrollYProgress} />
          </div>
          <motion.div style={{ y: reduce ? 0 : h1Y, opacity: reduce ? 1 : h1Opacity }}>
            <h1
              id="hero-title"
              className="text-center font-display text-[clamp(56px,15vw,96px)] font-extrabold uppercase leading-[var(--leading-h1)] tracking-[var(--tracking-h1)] text-ink [font-variation-settings:'wdth'_62] md:text-left md:text-[length:min(var(--text-h1),13.4cqw)]"
            >
              <span className="block">
                <Word i={0}>Tes</Word> <Word i={1}>futurs</Word>{" "}
              </span>
              <span className="block">
                <span className="relative block md:inline-block">
                  <span className="relative inline-block">
                    <ClientsCheck />
                    <Word i={2}>clients</Word>
                  </span>
                </span>{" "}
                <span className="block md:inline">
                  <Word i={3}>testent</Word>
                </span>{" "}
              </span>
              <span className="block">
                <Word i={4}>ton</Word> <Word i={5}>app.</Word>
              </span>
            </h1>
          </motion.div>
        </div>

        <div className="relative mt-6 md:mt-10 md:grid md:grid-cols-12 md:gap-x-[var(--grid-gutter)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
            <Stickers placement="cta" camp={camp} progress={scrollYProgress} />
          </div>
          <div className="md:col-span-8 lg:col-span-7">
            <p
              data-hero-guard
              className="hero-lift-12 mx-auto max-w-[34ch] text-balance text-center text-[clamp(18px,1.7vw,24px)] leading-[1.4] text-ink md:mx-0 md:max-w-[48ch] md:text-left"
            >
              Des pros vérifiés du métier que tu vises testent ton MVP de bout en bout et te disent la vérité.
            </p>

            <div className="hero-lift-16 mt-7 flex flex-col items-center gap-3 md:mt-9 md:flex-row md:gap-6">
              <Link
                href="/inscription?role=dev"
                prefetch={false}
                data-hero-cta
                data-camp="dev"
                onPointerEnter={() => setCamp("dev")}
                onPointerLeave={() => setCamp(null)}
                onFocus={() => setCamp("dev")}
                onBlur={() => setCamp(null)}
                className={`${ctaBase} flex bg-accent text-accent-ink md:inline-flex hover:bg-accent-press active:bg-accent-press`}
              >
                Je suis développeur
                <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <p data-hero-guard className="text-[14px] leading-none text-ink-muted">
                Inscription gratuite.
              </p>
            </div>
          </div>
        </div>

        {/* Reserved sticker zone on mobile and tablet. */}
        <div aria-hidden="true" className="relative mt-6 h-[72px] shrink-0 lg:hidden">
          <Stickers placement="bottom" camp={camp} progress={scrollYProgress} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-5 md:pointer-events-none md:flex-row md:items-end md:justify-between md:gap-4 md:absolute md:inset-x-[var(--grid-margin)] md:bottom-8 md:mt-0">
          <LiveBadge badge={heroBadge(stats)} demo={stats?.demo ?? false} className="md:pointer-events-auto" />
          <a
            href="#boucle"
            className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px] leading-none text-ink-muted transition-colors duration-150 hover:text-ink md:pointer-events-auto md:absolute md:left-1/2 md:-translate-x-1/2"
          >
            Tu connais la boucle ?
            <ChevronIcon size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
