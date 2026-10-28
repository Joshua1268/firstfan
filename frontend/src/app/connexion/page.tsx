import type { Metadata } from "next";
import { LoginForm } from "@/features/accounts/LoginForm";
import { PRODUCT_NAME } from "@/lib/brand";
import { PageShell } from "@/ui/PageShell";

export const metadata: Metadata = { title: `Connexion · ${PRODUCT_NAME}` };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = (await searchParams).next;
  return (
    <PageShell kicker="Connexion" title="Content de te revoir.">
      <div className="mt-10 max-w-[480px] md:mt-14">
        <LoginForm next={typeof next === "string" ? next : null} />
      </div>
    </PageShell>
  );
}
