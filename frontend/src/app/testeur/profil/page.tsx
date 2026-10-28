import type { Metadata } from "next";
import { TesterProfileForm } from "@/features/accounts/TesterProfileForm";
import { PRODUCT_NAME } from "@/lib/brand";
import { SpaceTitle } from "@/ui/AppShell";

export const metadata: Metadata = { title: `Mon profil testeur · ${PRODUCT_NAME}` };

export default function TesterProfilePage() {
  return (
    <div className="flex max-w-[560px] flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SpaceTitle>Ton profil</SpaceTitle>
        <p className="text-[16px] leading-[1.6] text-ink-muted">
          Ces informations servent à vérifier ton métier, puis à te payer après chaque test validé.
        </p>
      </div>
      <TesterProfileForm />
    </div>
  );
}
