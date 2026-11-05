import type { Metadata } from "next";
import { googleMessage, googleStartUrl } from "@/features/accounts/google";
import { GoogleButton } from "@/features/accounts/GoogleButton";
import { LoginForm } from "@/features/accounts/LoginForm";
import { PRODUCT_NAME } from "@/lib/brand";
import { FormAlert } from "@/ui/FormAlert";
import { PageShell } from "@/ui/PageShell";

export const metadata: Metadata = { title: `Connexion · ${PRODUCT_NAME}` };

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; google?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  return (
    <PageShell kicker="Connexion" title="Content de te revoir.">
      <div className="mt-10 flex max-w-[480px] flex-col gap-8 md:mt-14">
        <FormAlert message={googleMessage(params.google)} />
        <LoginForm next={next} />
        <GoogleButton href={googleStartUrl({ intent: "login", next })} />
      </div>
    </PageShell>
  );
}
