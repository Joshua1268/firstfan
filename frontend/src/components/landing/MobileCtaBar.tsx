"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { spring } from "@/lib/motion-tokens";

/**
 * Barre CTA collée en bas, mobile seulement (§3).
 * Visible quand le hero est sorti à 80 % ; masquée pendant le CTA final (#cta-final) et clavier ouvert.
 */
export function MobileCtaBar() {
  const reduce = useReducedMotion();
  const [pastHero, setPastHero] = useState(false);
  const [inFinalCta, setInFinalCta] = useState(false);
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) setPastHero(e.boundingClientRect.top < 0 && e.intersectionRatio <= 0.2);
          else setInFinalCta(e.isIntersecting);
        }
      },
      { threshold: [0, 0.2, 0.5, 1] },
    );
    if (hero) io.observe(hero);
    const finalCta = document.getElementById("cta-final");
    if (finalCta) io.observe(finalCta);

    // Clavier virtuel : le visualViewport rétrécit nettement.
    const vv = window.visualViewport;
    const onResize = () => vv && setKeyboard(vv.height < window.innerHeight * 0.75);
    vv?.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      vv?.removeEventListener("resize", onResize);
    };
  }, []);

  const shown = pastHero && !inFinalCta && !keyboard;

  return (
    <motion.div
      data-mobile-cta-bar
      aria-hidden={!shown}
      inert={!shown}
      initial={false}
      animate={shown ? { y: 0, opacity: 1 } : reduce ? { y: 0, opacity: 0 } : { y: "110%", opacity: 1 }}
      transition={{ type: "spring", ...spring.settle }}
      className="cta-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[rgb(10_10_11/0.92)] md:hidden"
    >
      <div className="flex h-16 items-center gap-2.5 px-[var(--grid-margin)]">
        <Link
          href="/inscription?role=tester"
          prefetch={false}
          data-camp="pro"
          className="flex h-11 flex-1 items-center justify-center rounded-pill bg-accent text-[15px] font-semibold text-accent-ink active:bg-accent-press"
        >
          Je teste
        </Link>
        <Link
          href="/inscription?role=dev"
          prefetch={false}
          data-camp="dev"
          className="flex h-11 flex-1 items-center justify-center rounded-pill border border-ink/60 text-[15px] font-semibold text-ink"
        >
          Je suis dev
        </Link>
      </div>
    </motion.div>
  );
}
