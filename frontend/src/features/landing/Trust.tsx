"use client";

import { motion, useAnimationControls, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { dur, spring } from "@/lib/motion-tokens";
import { ClockIcon, ShieldIcon, StarIcon } from "@/ui/icons";
import { containerCls, h2Cls, Kicker, riseVariants, useReveal, useReduce } from "./reveal";

const HASH = "9f3a…c21e";
const HEX = "0123456789abcdef";
const SCRAMBLE_MS = 700;
const STAMP = { type: "spring", stiffness: 600, damping: 16 } as const;

const BLOCKS = [
  { icon: ClockIcon, title: "Preuve d'antériorité" },
  { icon: ShieldIcon, title: "Protection anti-copie" },
  { icon: StarIcon, title: "Notation dans les deux sens" },
] as const;

// Written to textContent, so there is no React render per frame.
function useScramble(run: boolean, onDone: () => void) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!run) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / SCRAMBLE_MS);
      const fixed = Math.floor(k * HASH.length);
      let out = HASH.slice(0, fixed);
      for (let i = fixed; i < HASH.length; i++) out += HASH[i] === "…" ? "…" : HEX[(Math.random() * 16) | 0];
      el.textContent = out;
      if (k < 1) raf = requestAnimationFrame(tick);
      else {
        el.textContent = HASH;
        onDone();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = HASH;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is stable for one run
  }, [run]);
  return ref;
}

function Certificate() {
  const reduce = useReduce();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { once: true, amount: 0.5 });
  const [typing, setTyping] = useState(false);
  const [landed, setLanded] = useState(false);
  const stamp = useAnimationControls();
  const card = useAnimationControls();
  const ink = useAnimationControls();

  const run = inView && !reduce;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the cursor with the scramble
    if (run) setTyping(true);
  }, [run]);

  useEffect(() => {
    if (reduce) return;
    if (!inView) stamp.set({ scale: 1.6, rotate: -18, opacity: 0 });
  }, [reduce, inView, stamp]);

  const hashRef = useScramble(run, () => {
    setTyping(false);
    void stamp.start({
      scale: 1,
      rotate: -8,
      opacity: 1,
      transition: { ...STAMP, opacity: { duration: dur.instant / 1000 } },
    });
    window.setTimeout(() => {
      setLanded(true);
      void card.start({ y: [0, 3, 0], transition: { duration: 0.12, ease: "easeOut" } });
      void ink.start({
        scale: [0.7, 1.5],
        opacity: [0.9, 0],
        transition: { duration: dur.medium / 1000, ease: "easeOut" },
      });
    }, 140);
  });

  return (
    <motion.div
      ref={root}
      animate={card}
      role="group"
      aria-label="Certificat d'antériorité horodaté du projet MonApp."
      className="relative rounded-[var(--radius-card)] border border-line bg-surface p-6 font-mono text-[14px] leading-[1.9] text-ink shadow-[0_40px_80px_-20px_rgba(0,0,0,.6),inset_0_0_0_1px_rgba(242,237,227,.06)] md:p-8 md:text-[15px]"
    >
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        {PRODUCT_NAME} · Preuve d&apos;antériorité
      </p>
      <dl className="mt-5 flex flex-col">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-muted">Projet :</dt>
          <dd>MonApp</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-muted">Déposé le</dt>
          <dd>12/10/2026 à 14:02</dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-2">
          <dt className="text-ink-muted">sha256 :</dt>
          <dd className="inline-flex items-center">
            <span ref={hashRef} data-cert-hash="" className="tabular-nums">
              {HASH}
            </span>
            {typing && (
              <span aria-hidden="true" className="cert-cursor ml-0.5 inline-block h-[1.1em] w-[0.6em] bg-accent" />
            )}
          </dd>
        </div>
      </dl>

      <motion.div
        data-cert-stamp=""
        data-landed={landed || reduce ? "" : undefined}
        animate={stamp}
        initial={false}
        style={{ rotate: -8 }}
        className="absolute -right-2 -top-10 flex size-[104px] items-center justify-center rounded-full border-2 border-accent bg-surface-2 text-accent md:-right-6 md:-top-12 md:size-[120px]"
      >
        <span aria-hidden="true" className="absolute inset-[6px] rounded-full border border-dashed border-accent/60" />
        <span className="text-[12px] font-medium uppercase tracking-[0.14em] md:text-[13px]">Horodaté</span>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-accent"
          initial={{ opacity: 0 }}
          animate={ink}
        />
      </motion.div>
    </motion.div>
  );
}

export function Trust() {
  const reveal = useReveal(0.4);
  const block = riseVariants(20, spring.lift, 0.09, 0.9);
  return (
    <section id="confiance" aria-labelledby="trust-title" className="relative bg-surface-2 py-[var(--section-y)]">
      <div className={containerCls}>
        <div className="max-w-[820px]">
          <Kicker>Ton idée reste à toi</Kicker>
          <h2 id="trust-title" className={`${h2Cls} mt-4`}>
            Protégé dès le dépôt.
          </h2>
          <p className="mt-6 max-w-[60ch] text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink-muted">
            Ton projet est horodaté dès que tu le déposes&nbsp;: tu as une preuve d&apos;antériorité. Les testeurs
            s&apos;engagent à la confidentialité, le contenu est protégé contre la copie, et tout est tracé.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-x-[var(--grid-gutter)]">
          <div className="lg:col-span-6 lg:pr-8">
            <Certificate />
          </div>
          <motion.ul {...reveal} className="flex flex-col gap-3 lg:col-span-5 lg:col-start-8">
            {BLOCKS.map(({ icon: Icon, title }, i) => (
              <motion.li
                key={title}
                data-reveal=""
                custom={i}
                variants={block}
                className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5"
              >
                <span className="flex size-11 flex-none items-center justify-center rounded-full border border-line text-ink">
                  <Icon size={22} />
                </span>
                <span className="font-display text-[length:var(--text-h3)] font-extrabold leading-[var(--leading-h3)] text-ink [font-variation-settings:'wdth'_75]">
                  {title}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <p className="mt-12 max-w-[60ch] text-[15px] leading-[1.6] text-ink-muted">
          Paiements par un agrégateur mobile money. Rien ne passe de la main à la main.
        </p>
      </div>
    </section>
  );
}
