import type { Metadata } from "next";
import { CheckIcon } from "@/components/landing/icons";
import { Actions, PageShell, PrimaryLink, SecondaryLink } from "@/components/site/PageShell";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Inscription · ${PRODUCT_NAME}` };

type Role = "dev" | "tester";

const ROLES: Record<Role, { kicker: string; lead: string; points: string[]; other: { href: string; label: string } }> =
  {
    dev: {
      kicker: "Inscription · Développeur",
      lead: "Le parcours dev est en cours de construction. Dès l'ouverture, tu pourras faire tester ton app par des pros vérifiés de ton métier cible.",
      points: [
        "Déposer ton app, horodatée dès le dépôt.",
        "Choisir les métiers de tes testeurs.",
        "Savoir qui l'utilise encore à J7 et à J30.",
      ],
      other: { href: "/inscription?role=tester", label: "Voir le côté testeur" },
    },
    tester: {
      kicker: "Inscription · Testeur",
      lead: "Le parcours testeur est en cours de construction. Dès l'ouverture, tu pourras tester des apps pensées pour ton métier.",
      points: [
        "Prouver ton métier une fois, pour obtenir le badge vérifié.",
        "Tester des apps avec un parcours guidé, preuves à l'appui.",
        "Être rémunéré en mobile money après validation de ton test.",
      ],
      other: { href: "/inscription?role=dev", label: "Voir le côté dev" },
    },
  };

export default async function Inscription({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const raw = (await searchParams).role;
  const role = raw === "dev" || raw === "tester" ? raw : null;
  const r = role ? ROLES[role] : null;

  return (
    <PageShell
      kicker={r?.kicker ?? "Inscription"}
      title="Les inscriptions ouvrent bientôt."
      lead={
        r?.lead ??
        "Les comptes dev et testeur sont en cours de construction. Aucun formulaire n'est ouvert pour l'instant : rien ne t'est demandé ici."
      }
    >
      {r ? (
        <ul className="hero-lift-12 mt-10 grid max-w-[60ch] gap-3 md:mt-12">
          {r.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[16px] leading-[1.6] text-ink">
              <CheckIcon size={22} className="mt-px shrink-0 text-accent" />
              {p}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-8 max-w-[60ch] text-[14px] leading-snug text-ink-muted">
        Aucun formulaire n&apos;est ouvert pour l&apos;instant : aucune donnée n&apos;est collectée sur cette page.
      </p>
      <Actions>
        <PrimaryLink href="/">Retour à l&apos;accueil</PrimaryLink>
        {r ? (
          <SecondaryLink href={r.other.href}>{r.other.label}</SecondaryLink>
        ) : (
          <>
            <SecondaryLink href="/inscription?role=dev">Je suis développeur</SecondaryLink>
            <SecondaryLink href="/inscription?role=tester">Je teste et je suis rémunéré</SecondaryLink>
          </>
        )}
      </Actions>
    </PageShell>
  );
}
