"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import type { PublicStats } from "@/lib/stats";
import { ease } from "@/lib/motion-tokens";
import { ArrowIcon, ChevronIcon } from "./icons";
import { LiveBadge } from "./LiveBadge";

export type Camp = "dev" | "pro";

// §3.2 : composant client chargé sans SSR ; ses emplacements sont des calques absolus ou des zones
// de hauteur fixe déjà présentes dans le HTML, donc aucun saut de layout à l'arrivée.
const loadStickers = () => import("./Stickers").then((m) => m.Stickers);
const Stickers = dynamic(loadStickers, { ssr: false });
// Le tamponnage démarre à 800 ms (§2) : on lance le téléchargement du chunk dès l'évaluation du module,
// sans attendre la fin de l'hydratation.
if (typeof window !== "undefined") void loadStickers();

/** Mot du H1 : sort de son masque en CSS keyframes (classe `hero-word`), avant l'hydratation. */
function Word({ i, children }: { i: number; children: ReactNode }) {
  return (
    <span className="hero-mask" data-hero-guard>
      <span className="hero-word" style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

/**
 * Coche tracée à la main au-dessus de « CLIENTS » : la seule tache d'accent du titre.
 * Elle tient dans l'interligne (0.16em entre la ligne de base de FUTURS et le haut des capitales
 * de CLIENTS) et se pose sur le haut du mot, sans jamais toucher FUTURS (vérifié en e2e).
 */
function ClientsCheck() {
  const reduce = useReducedMotion();
  // 700 ms comptées depuis le début de la navigation (§2), pas depuis l'hydratation.
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
        // Opacité coupée tant que pathLength vaut 0 : sinon les embouts ronds dessinent deux points.
        // Même état initial au serveur et au client (pas d'écart d'hydratation) ;
        // en reduced-motion, la coche est posée tracée tout de suite.
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

function CtaPro({ onCamp, className = "" }: { onCamp: (c: Camp | null) => void; className?: string }) {
  return (
    <Link
      href="/inscription?role=tester"
      prefetch={false}
      data-hero-cta
      data-camp="pro"
      onPointerEnter={() => onCamp("pro")}
      onPointerLeave={() => onCamp(null)}
      onFocus={() => onCamp("pro")}
      onBlur={() => onCamp(null)}
      className={`${ctaBase} border border-ink/70 text-ink hover:border-ink hover:bg-ink/[0.07] ${className}`}
    >
      Je teste et je suis rémunéré
    </Link>
  );
}

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
        {/* Zone réservée haute (mobile). */}
        <div aria-hidden="true" className="relative h-[76px] shrink-0 lg:hidden">
          <Stickers placement="top" camp={camp} progress={scrollYProgress} />
        </div>

        <p data-hero-guard className="hero-lift-12 text-center font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted md:self-start md:text-left">
          Pour les devs qui ont un MVP et zéro vrai utilisateur
        </p>

        {/* Bloc titre : le H1 est dimensionné en unités de conteneur (jamais au-delà des colonnes 1 à 10),
            et les autocollants « titre » sont placés en % de ce bloc, donc ils suivent toutes les largeurs. */}
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

        {/* Zone réservée basse (mobile). */}
        <div aria-hidden="true" className="relative my-2 h-[88px] shrink-0 lg:hidden">
          <Stickers placement="bottom" camp={camp} progress={scrollYProgress} />
        </div>

        <div className="md:mt-10 md:grid md:grid-cols-12 md:gap-x-[var(--grid-gutter)]">
          <p data-hero-guard className="hero-lift-12 mx-auto max-w-[46ch] text-center text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink-muted md:col-span-6 md:mx-0 md:text-left lg:col-span-5">
            Des comptables, restauratrices, livreurs et commerçants vérifiés testent ton MVP de bout en bout. Ils te disent le
            gbê, pas des compliments. Ils sont rémunérés, ils te notent, et tu sais qui l&apos;utilise encore à J30.
          </p>

          <div className="relative mt-6 flex flex-col gap-4 md:col-span-6 md:mt-0 md:self-end lg:col-span-7 lg:col-start-6 xl:col-span-6 xl:col-start-7">
            {/* Autocollants ancrés sur la colonne des CTA (au-dessus, à droite, en dessous ; jamais dessus). */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
              <Stickers placement="cta" camp={camp} progress={scrollYProgress} />
            </div>
            <div className="hero-lift-16 flex flex-col gap-3 md:flex-row md:flex-wrap">
              {/* Sur mobile, le CTA pro passe devant (§3.2) ; le doublon masqué garde l'ordre de tabulation. */}
              <CtaPro onCamp={setCamp} className="flex md:hidden" />
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
              <CtaPro onCamp={setCamp} className="hidden md:inline-flex" />
            </div>
            <p data-hero-guard className="hero-lift-12 text-center text-[14px] leading-snug text-ink-muted md:self-start md:text-left">
              Inscription gratuite. Testeurs payés après validation, par Wave, Orange Money ou MTN MoMo.
            </p>
          </div>
        </div>

        {/* Pied du hero : badge en direct et indice de scroll. */}
        <div className="mt-8 flex flex-col items-center gap-5 md:pointer-events-none md:flex-row md:items-end md:justify-between md:gap-4 md:absolute md:inset-x-[var(--grid-margin)] md:bottom-8 md:mt-0">
          <LiveBadge value={stats?.tests_in_progress ?? null} demo={stats?.demo ?? false} className="md:pointer-events-auto" />
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
