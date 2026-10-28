"use client";

import { motion } from "motion/react";
import { PRODUCT_NAME } from "@/lib/brand";
import { dur, spring } from "@/lib/motion-tokens";
import { CheckIcon, StarIcon } from "@/ui/icons";
import { JobAvatar } from "@/features/landing/stage/avatars";
import { STAMP_SPRING, useReduce } from "@/features/landing/reveal";

// Decorative badge card: the same content is written as text on the page.

const ROWS = [
  { label: "Tests validés", value: "12" },
  { label: "Note des devs", value: "4,8 / 5", star: true },
  { label: "Paiement", value: "Wave" },
] as const;

const DROP = { type: "spring", ...spring.soft } as const;

export function ProfileCard() {
  const reduce = useReduce();
  const start = reduce ? false : "hidden";
  return (
    <motion.div
      aria-hidden="true"
      initial={start}
      animate="show"
      className="relative mx-auto w-full max-w-[340px] lg:max-w-[360px]"
    >
      {/* Lanyard */}
      <div className="absolute -top-24 left-1/2 hidden h-24 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-line lg:block" />
      <motion.div
        data-reveal=""
        variants={{
          hidden: { y: -48, rotate: -9, opacity: 0 },
          show: {
            y: 0,
            rotate: -3,
            opacity: 1,
            transition: { ...DROP, delay: 0.45, opacity: { duration: 0.2, delay: 0.45 } },
          },
        }}
        style={{ rotate: -3, transformOrigin: "50% 0%" }}
        className="relative rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[0_40px_80px_-24px_rgba(0,0,0,.7),inset_0_0_0_1px_rgba(242,237,227,.05)] md:p-7"
      >
        <span className="absolute left-1/2 top-3 h-2.5 w-12 -translate-x-1/2 rounded-pill border border-line bg-bg" />

        <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          <span>{PRODUCT_NAME} · Testeur</span>
          <span>Exemple</span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <JobAvatar size={64} />
          <div className="min-w-0">
            <p className="font-display text-[30px] font-extrabold leading-none text-ink [font-variation-settings:'wdth'_75]">
              Awa K.
            </p>
            <p className="mt-1.5 text-[15px] leading-snug text-ink-muted">Comptable · Cocody</p>
          </div>
        </div>

        <dl className="mt-7 divide-y divide-line border-y border-line">
          {ROWS.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-3 text-[15px]">
              <dt className="text-ink-muted">{r.label}</dt>
              <dd className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-ink">
                {"star" in r && <StarIcon size={15} fill="currentColor" className="text-accent" />}
                {r.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mb-3 mt-5 flex items-center gap-2 text-[14px] leading-snug text-ink">
          <CheckIcon size={18} strokeWidth={2} className="flex-none text-accent" />
          Invitations réservées aux comptables
        </p>

        {/* Stamp drops once the card has landed. */}
        <motion.span
          data-reveal=""
          variants={{
            hidden: { scale: 1.6, rotate: -22, opacity: 0 },
            show: {
              scale: 1,
              rotate: -10,
              opacity: 1,
              transition: { ...STAMP_SPRING, delay: 1.05, opacity: { duration: dur.instant / 1000, delay: 1.05 } },
            },
          }}
          style={{ rotate: -10 }}
          className="absolute -bottom-5 -right-2 inline-flex items-center gap-1.5 rounded-[10px] border-2 border-accent bg-bg px-3 py-1.5 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-accent md:-right-6"
        >
          <CheckIcon size={14} strokeWidth={2.5} />
          Métier vérifié
          {!reduce && (
            <motion.span
              className="pointer-events-none absolute inset-[-6px] rounded-[14px] border-2 border-accent"
              variants={{
                hidden: { scale: 0.8, opacity: 0 },
                show: {
                  scale: [0.8, 1.4],
                  opacity: [0.9, 0],
                  transition: { duration: dur.medium / 1000, ease: "easeOut", delay: 1.1 },
                },
              }}
            />
          )}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
