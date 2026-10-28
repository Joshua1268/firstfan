import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/accounts/RegisterForm";
import type { Role } from "@/features/accounts/types";
import { PRODUCT_NAME } from "@/lib/brand";
import { CheckIcon } from "@/ui/icons";
import { Actions, PageShell, PrimaryLink, SecondaryLink } from "@/ui/PageShell";

export const metadata: Metadata = { title: `Inscription · ${PRODUCT_NAME}` };

const ROLES: Record<Role, { kicker: string; title: string; points: string[]; other: { href: string; label: string } }> =
  {
    dev: {
      kicker: "Inscription · Développeur",
      title: "Fais tester ton app.",
      points: [
        "Déposer ton app, horodatée dès le dépôt.",
        "Choisir les métiers de tes testeurs.",
        "Savoir qui l'utilise encore à J7 et à J30.",
      ],
      other: { href: "/inscription?role=tester", label: "Je veux plutôt tester des apps" },
    },
    tester: {
      kicker: "Inscription · Testeur",
      title: "Teste des apps de ton métier.",
      points: [
        "Prouver ton métier une fois, pour obtenir le badge vérifié.",
        "Tester des apps avec un parcours guidé, preuves à l'appui.",
        "Être rémunéré en mobile money après validation de ton test.",
      ],
      other: { href: "/inscription?role=dev", label: "Je veux plutôt faire tester mon app" },
    },
  };

export default async function Inscription({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const raw = (await searchParams).role;
  const role = raw === "dev" || raw === "tester" ? raw : null;

  if (!role) {
    return (
      <PageShell
        kicker="Inscription"
        title="Qui es-tu ?"
        lead="Choisis ton compte : tu pourras commencer tout de suite."
      >
        <Actions>
          <PrimaryLink href="/inscription?role=dev">Je suis développeur</PrimaryLink>
          <SecondaryLink href="/inscription?role=tester">Je teste et je suis rémunéré</SecondaryLink>
        </Actions>
      </PageShell>
    );
  }

  const r = ROLES[role];
  return (
    <PageShell kicker={r.kicker} title={r.title}>
      <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-[minmax(0,480px)_minmax(0,1fr)] md:gap-20">
        <RegisterForm role={role} />
        <aside className="flex flex-col gap-6 md:border-l md:border-line md:pl-12">
          <ul className="grid gap-3">
            {r.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[16px] leading-[1.6] text-ink">
                <CheckIcon size={22} className="mt-px shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href={r.other.href}
            className="inline-flex min-h-11 items-center self-start text-[15px] text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            {r.other.label}
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
