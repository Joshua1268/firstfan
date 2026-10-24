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
type Stamp = { copy: number; index: number; id: number };

function JobList({ stamp, copy }: { stamp: Stamp | null; copy: number }) {
  const decor = copy > 0;
  return (
    <ul
      aria-hidden={decor || undefined}
      data-marquee-copy={decor ? "" : undefined}
      className={`${decor ? "marquee-copy-decor " : ""}marquee-list flex flex-none items-center gap-x-10 pr-10 max-md:gap-x-8 max-md:pr-8`}
    >
      {JOBS.map((job, i) => {
        const on = stamp?.copy === copy && stamp.index === i;
        return (
          <li
            key={job}
            data-pill=""
            data-copy={copy}
            data-index={i}
            data-stamped={on ? "true" : undefined}
            className="whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-3 font-display text-[22px] font-semibold text-ink [font-variation-settings:'wdth'_75] md:text-[28px]">
              <motion.span
                key={on ? stamp.id : "idle"}
                aria-hidden="true"
                className="relative inline-flex size-5 flex-none items-center justify-center rounded-full bg-ghost text-bg"
                initial={on ? { scale: 1.5 } : false}
                animate={{ scale: 1 }}
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
  const [stamp, setStamp] = useState<Stamp | null>(null);

  useEffect(() => {
    if (reduce || !inView) return;
    let id: ReturnType<typeof setInterval> | undefined;
    let hold: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    let last = "";
    const tick = () => {
      const band = ref.current;
      if (!band) return;
      // Une seule lecture de géométrie par tick : seuls les métiers entièrement dans la zone nette (hors fondu) sont éligibles.
      const area = band.getBoundingClientRect();
      const rects = [...band.querySelectorAll<HTMLElement>("[data-pill]")].map((el) => ({ el, r: el.getBoundingClientRect() }));
      const within = (inset: number) =>
        rects.filter(({ r }) => r.left >= area.left + inset && r.right <= area.right - inset).map(({ el }) => el);
      // Sur petit écran la zone nette peut être vide : on retombe sur tout ce qui est entièrement dans la bande.
      const visible = within(64).length ? within(64) : within(0);
      const pool = visible.filter((el) => `${el.dataset.copy}-${el.dataset.index}` !== last);
      const el = (pool.length ? pool : visible)[Math.floor(Math.random() * (pool.length || visible.length))];
      if (!el) return;
      last = `${el.dataset.copy}-${el.dataset.index}`;
      count += 1;
      setStamp({ copy: Number(el.dataset.copy), index: Number(el.dataset.index), id: count });
      clearTimeout(hold);
      hold = setTimeout(() => setStamp(null), STAMP_HOLD_MS);
    };
    const start = () => {
      if (id === undefined && !document.hidden) id = setInterval(tick, STAMP_EVERY_MS);
    };
    const stop = () => {
      clearInterval(id);
      id = undefined;
      clearTimeout(hold);
      setStamp(null);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
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
            <JobList stamp={stamp} copy={0} />
            <JobList stamp={stamp} copy={1} />
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[var(--grid-max)] text-center font-mono text-[12px] text-ink-muted md:text-left">
        Métier vérifié par CV, LinkedIn ou justificatif.
      </p>
    </section>
  );
}
