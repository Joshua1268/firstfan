import type { Metadata } from "next";
import { Actions, PageShell, PrimaryLink, SecondaryLink } from "@/ui/PageShell";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Connexion · ${PRODUCT_NAME}` };

export default function Connexion() {
  return (
    <PageShell
      kicker="Connexion"
      title="La connexion arrive avec les inscriptions."
      lead="Aucun compte n'existe encore : il n'y a rien à saisir ici pour l'instant. Tu pourras te connecter dès l'ouverture des inscriptions."
    >
      <Actions>
        <PrimaryLink href="/">Retour à l&apos;accueil</PrimaryLink>
        <SecondaryLink href="/inscription">Voir les inscriptions</SecondaryLink>
      </Actions>
    </PageShell>
  );
}
