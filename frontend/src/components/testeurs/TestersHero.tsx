import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "@/components/landing/icons";
import { APPLY_HREF, APPLY_LABEL } from "./apply";
import { ProfileCard } from "./ProfileCard";

/** Mot du H1 : même sortie de masque en CSS que l'accueil (classes `hero-mask` / `hero-word`, coupées en reduced-motion). */
function Word({ i, children }: { i: number; children: ReactNode }) {
  return (
    <span className="hero-mask">
      <span className="hero-word" style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

/**
 * Hero de /testeurs : même hiérarchie que l'accueil. Niveau 1 le H1, niveau 2 une phrase, niveau 3 un seul bouton,
 * présenté comme une candidature (le profil est vérifié). À droite (desktop) ou dessous (mobile) : la carte pro.
 */
export function TestersHero() {
  return (
    <section id="hero" aria-labelledby="testeurs-title" className="relative overflow-x-clip pt-16">
      <div className="mx-auto grid w-full max-w-[calc(var(--grid-max)+2*var(--grid-margin))] gap-y-14 px-[var(--grid-margin)] pb-20 pt-10 md:pt-16 lg:min-h-[calc(100svh-64px)] lg:grid-cols-12 lg:items-center lg:gap-x-[var(--grid-gutter)] lg:pb-24 lg:pt-10">
        <div className="lg:col-span-7">
          <p className="hero-lift-12 font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted">
            Pour les pros de terrain
          </p>
          <div className="mt-4 [container-type:inline-size] md:mt-6">
            <h1
              id="testeurs-title"
              className="font-display text-[clamp(56px,15vw,96px)] font-extrabold uppercase leading-[var(--leading-h1)] tracking-[var(--tracking-h1)] text-ink [font-variation-settings:'wdth'_62] md:text-[length:min(var(--text-h1),17cqw)]"
            >
              <span className="block">
                <Word i={0}>Ton</Word> <Word i={1}>métier</Word>{" "}
              </span>
              <span className="block">
                <Word i={2}>fait</Word> <Word i={3}>les</Word>{" "}
              </span>
              <span className="block">
                <Word i={4}>bonnes</Word> <Word i={5}>apps.</Word>
              </span>
            </h1>
          </div>

          <p className="hero-lift-12 mt-7 max-w-[34ch] text-balance text-[clamp(18px,1.7vw,24px)] leading-[1.4] text-ink md:mt-10 md:max-w-[40ch]">
            Des devs construisent des outils pour ton travail. Tu les testes, tu leur dis ce qui coince, et chaque test
            est rémunéré.
          </p>

          <div className="hero-lift-16 mt-7 flex flex-col gap-3 md:mt-9 md:flex-row md:items-center md:gap-6">
            <Link
              href={APPLY_HREF}
              prefetch={false}
              data-apply-cta=""
              className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill bg-accent px-7 text-[16px] font-semibold leading-none text-accent-ink transition-colors duration-150 hover:bg-accent-press active:bg-accent-press md:w-auto"
            >
              {APPLY_LABEL}
              <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <p className="text-center text-[14px] leading-snug text-ink-muted md:text-left">
              Gratuit. Ton métier est vérifié une seule fois.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <ProfileCard />
        </div>
      </div>
    </section>
  );
}
