"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { spring } from "@/lib/motion-tokens";

// Hidden over the final CTA and while the keyboard is open.
export function MobileCtaBar({
  href = "/inscription?role=dev",
  label = "Je suis développeur",
  camp = "dev",
}: {
  href?: string;
  label?: string;
  camp?: "dev" | "pro";
}) {
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

    // The virtual keyboard shrinks the visual viewport.
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
          href={href}
          prefetch={false}
          data-camp={camp}
          className="flex h-11 flex-1 items-center justify-center rounded-pill bg-accent text-[15px] font-semibold text-accent-ink active:bg-accent-press"
        >
          {label}
        </Link>
      </div>
    </motion.div>
  );
}
