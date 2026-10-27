"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { dur, ease, spring } from "@/lib/motion-tokens";
import { containerCls, h2Cls, Kicker, STAMP_SPRING, useReveal } from "./reveal";

/**
 * Section « C'est quoi FirstFan ? » (§3.7) : trois cartes, chacune avec son illustration au trait (64px)
 * qui se trace après l'entrée de la carte, puis son détail accent qui se tamponne.
 * Mobile : cartes empilées, sous-ligne TESTEUR avant la sous-ligne DEV. Reduced-motion : tout est posé.
 */

const CARDS = [
  {
    n: "01",
    title: "Vérifié.",
    text: "Chaque testeur prouve son métier. Chaque test laisse une trace horodatée.",
    dev: "Tu sais qui te teste.",
    tester: "On sait ce que tu vaux.",
  },
  {
    n: "02",
    title: "Rémunéré.",
    text: "Le testeur est payé après validation, par mobile money. Son expertise a de la valeur, on la traite comme telle.",
    dev: "Tu paies du vrai retour, pas des likes.",
    tester: "Ton expertise métier est enfin reconnue.",
  },
  {
    n: "03",
    title: "Adopté.",
    text: "On ne mesure pas les «\u00a0c'est super\u00a0». On mesure qui revient à J7 et à J30.",
    dev: "Tu vois ta vraie courbe.",
    tester: "Tu gardes les outils qui t'aident, avec des avantages en plus.",
  },
] as const;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", ...spring.soft, delay: i * 0.1, opacity: { duration: 0.24, delay: i * 0.1 } },
  }),
};

/** Tracé : 200 ms après la carte, 600 ms en in-out. */
const drawVariants = (i: number): Variants => ({
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { delay: i * 0.1 + 0.2, duration: 0.6, ease: ease.inOut }, opacity: { delay: i * 0.1 + 0.2, duration: 0.01 } },
  },
});

/** Détail accent : tamponné à la fin du tracé. */
const stampVariants = (i: number): Variants => ({
  hidden: { scale: 1.5, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { ...STAMP_SPRING, delay: i * 0.1 + 0.75, opacity: { duration: dur.instant / 1000, delay: i * 0.1 + 0.75 } },
  },
});

function Draw({ d, i }: { d: string; i: number }) {
  return <motion.path data-reveal-path="" d={d} variants={drawVariants(i)} />;
}

function Illustration({ i, children }: { i: number; children: (i: number) => ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="overflow-visible text-ink"
    >
      {children(i)}
    </svg>
  );
}

/** Une carte d'identité qui reçoit un tampon. */
function IdCard(i: number) {
  return (
    <>
      <Draw i={i} d="M10 16h44a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z" />
      <Draw i={i} d="M20 26a5 5 0 1 0 0.01 0M13 42c1.4-4 4-6 7-6s5.6 2 7 6" />
      <Draw i={i} d="M33 26h16M33 32h12M33 38h8" />
      <motion.g data-reveal="" variants={stampVariants(i)} style={{ originX: "48px", originY: "46px" }}>
        <circle cx="48" cy="46" r="9" fill="var(--accent)" stroke="var(--accent)" />
        <path d="M44 46.5l3 3 5.5-6" stroke="var(--accent-ink)" strokeWidth={2} />
      </motion.g>
    </>
  );
}

/** Un téléphone qui reçoit la notification « Paiement envoyé » (aucun chiffre). */
function PhoneNotif(i: number) {
  return (
    <>
      <Draw i={i} d="M24 6h16a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z" />
      <Draw i={i} d="M29 52h6" />
      <motion.g data-reveal="" variants={stampVariants(i)} style={{ originX: "34px", originY: "22px" }}>
        <rect x="12" y="15" width="44" height="14" rx="4" fill="var(--accent)" stroke="var(--accent)" />
        <path d="M17 22l2.5 2.5 4.5-5" stroke="var(--accent-ink)" strokeWidth={2} />
        <path d="M28 20h20M28 24.5h12" stroke="var(--accent-ink)" strokeWidth={1.75} />
      </motion.g>
    </>
  );
}

/** Une mini-courbe qui reste haute. */
function HighCurve(i: number) {
  return (
    <>
      <Draw i={i} d="M8 8v48h50" />
      <Draw i={i} d="M8 48c6-24 12-30 20-30s16 2 26-2" />
      <motion.g data-reveal="" variants={stampVariants(i)} style={{ originX: "54px", originY: "16px" }}>
        <circle cx="54" cy="16" r="5" fill="var(--accent)" stroke="var(--accent)" />
      </motion.g>
    </>
  );
}

const ILLUSTRATIONS = [IdCard, PhoneNotif, HighCurve];

function Line({ who, text, className = "" }: { who: "DEV" | "TESTEUR"; text: string; className?: string }) {
  return (
    <p className={`flex items-start gap-3 ${className}`}>
      <span className="mt-0.5 inline-flex h-6 flex-none items-center rounded-pill bg-line px-2.5 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-ink">
        {who}
      </span>
      <span className="text-[15px] leading-snug text-ink">{text}</span>
    </p>
  );
}

export function WhatIs() {
  const reveal = useReveal(0.5);
  return (
    <section id="comment-ca-marche" aria-labelledby="whatis-title" className="relative py-[var(--section-y)]">
      <div className={containerCls}>
        <Kicker>C&apos;est quoi {PRODUCT_NAME}&nbsp;?</Kicker>
        <h2 id="whatis-title" className={`${h2Cls} mt-4`}>
          Trois promesses. Deux gagnants.
        </h2>

        <motion.ol {...reveal} className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-3 lg:gap-[var(--grid-gutter)]">
          {CARDS.map((c, i) => (
            <motion.li key={c.n} data-reveal="" custom={i} variants={cardVariants} className="group">
              <article className="relative h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-transform duration-[160ms] ease-out md:p-8 [@media(hover:hover)]:group-hover:-translate-y-1">
                {/* Filet accent 40 % au survol : calque en opacité, la bordure ne s'anime pas. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit] border border-accent/40 opacity-0 transition-opacity duration-[160ms] [@media(hover:hover)]:group-hover:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-[148px] font-extrabold leading-none text-line [font-variation-settings:'wdth'_75]"
                >
                  {c.n}
                </span>
                <div className="relative">
                  <Illustration i={i}>{ILLUSTRATIONS[i]}</Illustration>
                  <h3 className="mt-8 font-display text-[length:var(--text-h3)] font-extrabold leading-[var(--leading-h3)] text-ink [font-variation-settings:'wdth'_75]">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.6] text-ink-muted">{c.text}</p>
                  <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
                    <Line who="DEV" text={c.dev} className="order-2 lg:order-1" />
                    <Line who="TESTEUR" text={c.tester} className="order-1 lg:order-2" />
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
