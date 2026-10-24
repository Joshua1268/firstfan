"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { CheckIcon } from "./icons";

const JOBS = [
  "Comptable",
  "Restauratrice",
  "Livreur",
  "Commerçante",
  "Gérant de maquis",
  "Transitaire",
  "Pharmacienne",
  "Couturier",
  "Designer",
  "Agent immobilier",
  "Infirmière",
  "Chauffeur VTC",
  "Coiffeuse",
  "Enseignant",
] as const;

const STAMP_EVERY_MS = 4000;
const STAMP_HOLD_MS = 1200;
// Pas de 5 sur 14 métiers : 5 et 14 sont copremiers, tous les métiers passent à tour de rôle.
const STAMP_STEP = 5;

function JobList({ stamped, decor }: { stamped: number | null; decor?: boolean }) {
  const extra = decor ? "marquee-copy-decor" : "";
  return (
    <ul
      aria-hidden={decor || undefined}
      data-marquee-copy={decor ? "" : undefined}
      className={`${extra} marquee-list flex flex-none items-center gap-x-10 pr-10 max-md:gap-x-8 max-md:pr-8`}
    >
      {JOBS.map((job, i) => {
        const on = stamped === i;
        return (
          <li key={job} className="whitespace-nowrap">
            <span className="inline-flex items-center gap-3 font-display text-[22px] font-semibold text-ink [font-variation-settings:'wdth'_75] md:text-[28px]">
              <motion.span
                aria-hidden="true"
                className="relative inline-flex size-5 flex-none items-center justify-center rounded-full bg-ghost text-bg"
                initial={false}
                animate={{ scale: on ? [1.5, 1] : 1 }}
                transition={{ type: "spring", stiffness: 600, damping: 24 }}
              >
                <span
                  className="absolute inset-0 rounded-full bg-accent transition-opacity duration-150"
                  style={{ opacity: on ? 1 : 0 }}
                />
                <CheckIcon size={12} strokeWidth={2.5} className="relative" />
              </motion.span>
              <span className="transition-opacity duration-150" style={{ opacity: on ? 1 : 0.7 }}>
                {job}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function JobsMarquee() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [stamped, setStamped] = useState<number | null>(null);

  useEffect(() => {
    if (reduce || !inView) {
      setStamped(null);
      return;
    }
    let next = 0;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      if (document.hidden) return;
      setStamped(next);
      next = (next + STAMP_STEP) % JOBS.length;
      clearTimeout(hold);
      hold = setTimeout(() => setStamped(null), STAMP_HOLD_MS);
    };
    const id = setInterval(tick, STAMP_EVERY_MS);
    return () => {
      clearInterval(id);
      clearTimeout(hold);
    };
  }, [reduce, inView]);

  return (
    <section
      data-jobs-marquee
      aria-label="Métiers vérifiés"
      className="px-[var(--grid-margin)] py-6 md:py-8"
    >
      <div className="mx-auto flex max-w-[var(--grid-max)] flex-col items-center gap-4 md:flex-row md:gap-8">
        <p className="flex-none font-mono text-[12px] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted">
          MÉTIERS VÉRIFIÉS SUR {PRODUCT_NAME}
        </p>
        <div
          ref={ref}
          className="marquee-band h-[72px] min-w-0 flex-1 self-stretch overflow-hidden border-y border-line md:self-auto"
        >
          <div data-marquee-track className="marquee-track h-full items-center">
            <JobList stamped={stamped} />
            <JobList stamped={stamped} decor />
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[var(--grid-max)] text-center font-mono text-[12px] text-ink-muted md:text-left">
        Métier vérifié par CV, LinkedIn ou justificatif.
      </p>
    </section>
  );
}
