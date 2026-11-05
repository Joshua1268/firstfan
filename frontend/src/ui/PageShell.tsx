import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_LINKS } from "@/lib/site-links";
import { ArrowIcon } from "@/ui/icons";
import { Logo } from "@/ui/Logo";

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
          <Link href="/" className="flex min-h-11 items-center text-ink">
            <Logo />
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <Logo size={28} className="text-ink" />
            <p>Construit à Abidjan, pour les devs, par les devs.</p>
          </div>
          <ul className="flex flex-wrap gap-x-6">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
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

// One titled block of a long text page (privacy policy, terms).
export function TextSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8 md:grid md:grid-cols-12 md:gap-x-[var(--grid-gutter)]">
      <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink md:col-span-4">
        {title}
      </h2>
      <div className="mt-4 max-w-[65ch] space-y-4 text-[16px] leading-[1.6] text-ink-muted md:col-span-8 md:mt-1 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function TextSections({ updated, children }: { updated: string; children: ReactNode }) {
  return (
    <div className="mt-12 md:mt-16">
      <p className={kickerCls}>Mis à jour le {updated}</p>
      <div className="mt-8 space-y-10 md:space-y-12">{children}</div>
    </div>
  );
}

export const textLinkCls =
  "text-ink underline decoration-line underline-offset-4 transition-colors duration-150 hover:decoration-ink";
