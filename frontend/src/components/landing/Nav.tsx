"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { dur, ease } from "@/lib/motion-tokens";

const LINKS = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#pour-les-testeurs", label: "Pour les testeurs" },
  { href: "#entre-devs", label: "Entre devs" },
] as const;

export function Nav() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // §3.1 : fond lié au scroll sur 40px ; en reduced-motion, il change d'un coup.
  const bgSmooth = useTransform(scrollY, [0, 40], [0, 1]);
  const bgStep = useTransform(scrollY, (v) => (v > 40 ? 1 : 0));
  const bgOpacity = reduce ? bgStep : bgSmooth;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 border-b border-line bg-[rgb(10_10_11/0.85)]"
        style={{ opacity: bgOpacity }}
      />
      <nav
        aria-label="Navigation principale"
        className="relative z-10 mx-auto flex h-full max-w-[calc(var(--grid-max)+2*var(--grid-margin))] items-center justify-between px-[var(--grid-margin)]"
      >
        <Link href="/" className="font-display text-[22px] font-extrabold leading-none tracking-tight text-ink">
          {PRODUCT_NAME}
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 xl:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[15px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 md:flex">
          <Link prefetch={false} href="/connexion" className="text-[15px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink">
            Connexion
          </Link>
          <Link
            href="/inscription?role=dev"
            prefetch={false}
            className="inline-flex h-10 items-center rounded-pill border border-ink/40 px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.06]"
          >
            Je suis développeur
          </Link>
        </div>

        <button
          type="button"
          className="relative -mr-2 flex size-11 items-center justify-center text-ink md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {/* Icône menu à deux traits, qui se croisent à l'ouverture. */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            <motion.path
              d="M4 12h16"
              initial={false}
              animate={open ? { y: 0, rotate: 45 } : { y: -3, rotate: 0 }}
              transition={{ duration: dur.fast / 1000, ease: ease.outQuint }}
              style={{ originX: "50%", originY: "50%" }}
            />
            <motion.path
              d="M4 12h16"
              initial={false}
              animate={open ? { y: 0, rotate: -45 } : { y: 3, rotate: 0 }}
              transition={{ duration: dur.fast / 1000, ease: ease.outQuint }}
              style={{ originX: "50%", originY: "50%" }}
            />
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            key="menu"
            className="fixed inset-0 z-0 flex flex-col bg-bg px-[var(--grid-margin)] pb-[max(24px,env(safe-area-inset-bottom))] pt-24 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "linear" }}
          >
            <motion.ul
              className="flex flex-col"
              initial="hidden"
              animate="shown"
              variants={{ shown: { transition: { delayChildren: 0.12, staggerChildren: 0.04 } } }}
            >
              {[...LINKS, { href: "/connexion", label: "Connexion" }].map((l) => (
                <motion.li
                  key={l.href}
                  className="border-b border-line"
                  variants={{
                    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
                    shown: { opacity: 1, y: 0, transition: { duration: dur.base / 1000, ease: ease.outQuint } },
                  }}
                >
                  <Link
                    href={l.href}
                    prefetch={false}
                    onClick={close}
                    className="flex min-h-16 items-center font-display text-[32px] font-extrabold uppercase leading-none [font-variation-settings:'wdth'_75]"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-auto flex flex-col gap-3">
              <Link
                href="/inscription?role=tester"
                prefetch={false}
                onClick={close}
                className="flex h-14 items-center justify-center rounded-pill bg-accent text-[16px] font-semibold text-accent-ink"
              >
                Je teste et je suis rémunéré
              </Link>
              <Link
                href="/inscription?role=dev"
                prefetch={false}
                onClick={close}
                className="flex h-14 items-center justify-center rounded-pill border border-ink/60 text-[16px] font-semibold text-ink"
              >
                Je suis développeur
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
