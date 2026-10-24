import type { Metadata } from "next";
import { Actions, PageShell, PrimaryLink, SecondaryLink } from "@/components/site/PageShell";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Page introuvable · ${PRODUCT_NAME}` };

export default function NotFound() {
  return (
    <PageShell
      kicker="Erreur 404"
      title="Cette page n'existe pas."
      lead="Le lien est peut-être ancien, ou la page n'est pas encore construite. Repars de l'accueil, tout y est."
    >
      <Actions>
        <PrimaryLink href="/">Retour à l&apos;accueil</PrimaryLink>
        <SecondaryLink href="/#comment-ca-marche">Voir comment ça marche</SecondaryLink>
      </Actions>
    </PageShell>
  );
}
