"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { footerLinks, type SitePage } from "@/lib/site-links";
import { containerCls, useReduce } from "./reveal";

/**
 * Footer (§3.11) : Geist 14px, filet `--line`, et le [NOM] en très grand, en contour blanc chaud à 8 %,
 * rogné en bas. Il remonte de y 20 % à 0 par scrub à l'entrée ; statique en reduced-motion.
 */

export function Footer({ page = "home" }: { page?: SitePage }) {
  const LINKS = footerLinks(page);
  const reduce = useReduce();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["20%", "0%"]);

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-line pt-16 text-[14px] leading-[1.6] text-ink-muted md:pt-20">
      <div className={`${containerCls} flex flex-col gap-8 md:flex-row md:items-start md:justify-between`}>
        <div className="max-w-[52ch]">
          <p>
            <span className="font-semibold text-ink">{PRODUCT_NAME}</span> · Construit à Abidjan, pour les devs, par les devs ·
            Projet CADEV 2026 · Groupe Côte d&apos;Ivoire
          </p>
          <p className="mt-3">Paiements via un agrégateur mobile money.</p>
        </div>
        <nav aria-label="Liens du pied de page">
          <ul className="flex flex-col gap-1 md:flex-row md:flex-wrap md:gap-x-6">
            {LINKS.map((l) => (
              <li key={l.href}>
                {l.href.startsWith("#") ? (
                  <a href={l.href} className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-ink">
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} prefetch={false} className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-ink">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Le [NOM] géant, rogné en bas : décoratif (le nom est déjà dans la ligne du dessus). */}
      <div aria-hidden="true" className="mt-12 h-[clamp(96px,22vw,320px)] overflow-hidden md:mt-16">
        <motion.p
          style={reduce ? undefined : { y }}
          className="footer-name select-none whitespace-nowrap text-center font-display text-[clamp(120px,30vw,440px)] font-extrabold uppercase leading-[0.8] [font-variation-settings:'wdth'_62]"
        >
          {PRODUCT_NAME}
        </motion.p>
      </div>
    </footer>
  );
}
