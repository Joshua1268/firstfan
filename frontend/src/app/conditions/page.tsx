import type { Metadata } from "next";
import { Terms } from "@/features/legal/Terms";
import { PRODUCT_NAME } from "@/lib/brand";
import { PageShell } from "@/ui/PageShell";

export const metadata: Metadata = {
  title: `Conditions d'utilisation · ${PRODUCT_NAME}`,
  description: `Les règles d'utilisation de ${PRODUCT_NAME} pour les développeurs et les testeurs.`,
};

export default function Conditions() {
  return (
    <PageShell
      kicker="Conditions d'utilisation"
      title="Les règles du jeu."
      lead={`Ce que ${PRODUCT_NAME} propose, ce que chacun s'engage à faire et ce qui est interdit.`}
    >
      <Terms />
    </PageShell>
  );
}
