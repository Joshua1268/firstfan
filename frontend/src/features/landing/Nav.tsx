"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { dur, ease } from "@/lib/motion-tokens";
import { navLinks, PAGE_CTA, type SitePage } from "@/lib/site-links";
import { Logo } from "@/ui/Logo";

export function Nav({ page = "home" }: { page?: SitePage }) {
  const LINKS = navLinks(page);
  const cta = PAGE_CTA[page];
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // Background follows the first 40px of scroll; it switches at once with reduced motion.
  const bgSmooth = useTransform(scrollY, [0, 40], [0, 1]);
  const bgStep = useTransform(scrollY, (v) => (v > 40 ? 1 : 0));
  const bgOpacity = reduce ? bgStep : bgSmooth;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Focus goes back to the button, except after a link click.
  const returnFocus = useRef(false);
  const close = useCallback((restoreFocus = true) => {
    returnFocus.current = restoreFocus;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      if (returnFocus.current) buttonRef.current?.focus();
      returnFocus.current = false;
      return;
    }
    menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      // Focus trap: the button, then the menu links.
      const items = [buttonRef.current, ...(menuRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? [])].filter(
        (el): el is HTMLElement => el !== null,
      );
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === -1 || i === items.length - 1 ? 0 : i + 1;
      e.preventDefault();
      items[next].focus();
    };
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
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
        <Link href="/" className="flex min-h-11 items-center text-ink">
          <Logo />
        </Link>

        {/* In the flow from 1024 to 1279px so nothing overlaps, centered above. */}
        <ul className="hidden items-center gap-6 lg:flex xl:absolute xl:left-1/2 xl:-translate-x-1/2 xl:gap-8">
          {LINKS.map((l) => (
            <li key={l.href}>
              {l.href.startsWith("/testeurs") ? (
                <Link
                  href={l.href}
                  prefetch={false}
                  aria-current={page === "testeurs" ? "page" : undefined}
                  className="text-[15px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink aria-[current=page]:text-ink"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  href={l.href}
                  className="text-[15px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
                >
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 md:ml-auto md:flex lg:ml-0">
          <Link
            prefetch={false}
            href="/connexion"
            className="text-[15px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
          >
            Connexion
          </Link>
          <Link
            href={cta.href}
            prefetch={false}
            className="inline-flex h-10 items-center rounded-pill border border-ink/40 px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.06]"
          >
            {cta.label}
          </Link>
        </div>

        <button
          ref={buttonRef}
          type="button"
          className="relative -mr-2 flex size-11 items-center justify-center text-ink md:ml-4 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => (open ? close() : setOpen(true))}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
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
            ref={menuRef}
            id={menuId}
            data-mobile-menu
            key="menu"
            className="fixed inset-0 z-0 flex flex-col bg-bg px-[var(--grid-margin)] pb-[max(24px,env(safe-area-inset-bottom))] pt-24 lg:hidden"
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
                    onClick={() => close(false)}
                    className="flex min-h-16 items-center font-display text-[32px] font-extrabold uppercase leading-none [font-variation-settings:'wdth'_75]"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-auto flex flex-col gap-3">
              <Link
                href={cta.href}
                prefetch={false}
                onClick={() => close(false)}
                className="flex h-14 items-center justify-center rounded-pill bg-accent text-[16px] font-semibold text-accent-ink"
              >
                {cta.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
