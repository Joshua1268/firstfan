import type { Metadata } from "next";
import { PrivacyPolicy } from "@/features/legal/PrivacyPolicy";
import { PRODUCT_NAME } from "@/lib/brand";
import { PageShell } from "@/ui/PageShell";

export const metadata: Metadata = {
  title: `Confidentialité · ${PRODUCT_NAME}`,
  description: `Les données que ${PRODUCT_NAME} collecte, pourquoi, avec qui elles sont partagées et comment exercer tes droits.`,
};

export default function Confidentialite() {
  return (
    <PageShell
      kicker="Politique de confidentialité"
      title="Tes données, en clair."
      lead={`Ce que ${PRODUCT_NAME} collecte, pourquoi, qui y a accès et comment garder la main dessus.`}
    >
      <PrivacyPolicy />
    </PageShell>
  );
}
