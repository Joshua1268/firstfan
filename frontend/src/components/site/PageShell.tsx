import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "@/components/landing/icons";
import { PRODUCT_NAME } from "@/lib/brand";

// Same classes as reveal.tsx, whose client constants a server component cannot import.
const containerCls = "mx-auto w-full max-w-[calc(var(--grid-max)+2*var(--grid-margin))] px-[var(--grid-margin)]";
const kickerCls =
  "font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted";

// Shell of the simple pages; server rendered, readable without JS.
export function PageShell({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="border-b border-line">
        <nav aria-label="Navigation principale" className={`${containerCls} flex h-16 items-center justify-between`}>
          <Link href="/" className="font-display text-[22px] font-extrabold leading-none tracking-tight text-ink">
            {PRODUCT_NAME}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-[15px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
          >
            Retour à l&apos;accueil
          </Link>
        </nav>
      </header>

      <main id="contenu" className={`${containerCls} pb-[var(--section-y)] pt-16 md:pt-24`}>
        <p className={`${kickerCls} hero-lift-12 flex items-center gap-3`}>
          <span aria-hidden="true" className="inline-block size-2 rounded-full bg-accent" />
          {kicker}
        </p>
        <h1 className="mt-5 max-w-[16ch] font-display text-[clamp(44px,8.5vw,120px)] font-extrabold uppercase leading-[0.94] tracking-[var(--tracking-h1)] text-ink [font-variation-settings:'wdth'_62] text-balance md:mt-7">
          {title}
        </h1>
        {lead && (
          <p className="hero-lift-12 mt-6 max-w-[46ch] text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink-muted md:mt-8">
            {lead}
          </p>
        )}
        {children}
      </main>

      <footer className="border-t border-line py-10 text-[14px] leading-[1.6] text-ink-muted">
        <div className={`${containerCls} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
          <p>
            <span className="font-semibold text-ink">{PRODUCT_NAME}</span> · Projet CADEV 2026 · Groupe Côte
            d&apos;Ivoire
          </p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link
                href="/confidentialite"
                className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-ink"
              >
                Confidentialité
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-ink"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}

const btnBase =
  "group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill px-7 text-[16px] font-semibold leading-none transition-colors duration-150 md:w-auto";

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${btnBase} bg-accent text-accent-ink hover:bg-accent-press active:bg-accent-press`}>
      {children}
      <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${btnBase} border border-ink/70 text-ink hover:border-ink hover:bg-ink/[0.07]`}>
      {children}
    </Link>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="hero-lift-16 mt-10 flex flex-col gap-3 md:mt-12 md:flex-row md:flex-wrap">{children}</div>;
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
      <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[16px] leading-[1.6] text-ink-muted">{children}</div>
    </section>
  );
}
