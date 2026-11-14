import type { Metadata } from "next";
import { VerificationPanel } from "@/features/accounts/VerificationPanel";
import { PRODUCT_NAME } from "@/lib/brand";
import { SpaceTitle } from "@/ui/AppShell";

export const metadata: Metadata = { title: `Vérifier mon métier · ${PRODUCT_NAME}` };

export default function VerificationPage() {
  return (
    <div className="flex max-w-[560px] flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SpaceTitle>Vérifier ton métier</SpaceTitle>
        <p className="text-[16px] leading-[1.6] text-ink-muted">
          Les campagnes qui visent un métier ne prennent que des testeurs qui l&apos;exercent vraiment. Une pièce
          suffit, et la vérification vaut pour toutes tes campagnes pendant 12 mois.
        </p>
      </div>
      <VerificationPanel />
    </div>
  );
}
