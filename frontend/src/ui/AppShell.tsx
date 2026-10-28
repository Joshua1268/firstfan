import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/ui/Logo";

const containerCls = "mx-auto w-full max-w-[calc(960px+2*var(--grid-margin))] px-[var(--grid-margin)]";

// Frame of the logged-in spaces: logo, link to the space home, and a slot for the logout button.
export function AppShell({
  spaceHref,
  spaceLabel,
  actions,
  children,
}: {
  spaceHref: string;
  spaceLabel: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-b border-line">
        <nav aria-label="Navigation de l'espace" className={`${containerCls} flex h-16 items-center gap-4`}>
          <Link href={spaceHref} className="flex min-h-11 items-center text-ink">
            <Logo variant="mark" size={32} className="md:hidden" />
            <Logo size={32} className="hidden md:block" />
          </Link>
          <Link
            href={spaceHref}
            className="inline-flex min-h-11 items-center font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted transition-colors duration-150 hover:text-ink"
          >
            {spaceLabel}
          </Link>
          <div className="ml-auto">{actions}</div>
        </nav>
      </header>
      <main id="contenu" className={`${containerCls} pb-24 pt-10 md:pt-16`}>
        {children}
      </main>
    </>
  );
}

export function SpaceTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[clamp(36px,6vw,64px)] font-extrabold uppercase leading-[0.95] text-ink [font-variation-settings:'wdth'_62]">
      {children}
    </h1>
  );
}
