"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { StatusPill } from "@/ui/StatusPill";
import { getChecks, submitCheck } from "./api";
import { checkStatusView } from "./check-status";
import { ProofForm } from "./ProofForm";

export function VerificationPanel() {
  const router = useRouter();
  const { data, error, reload } = useApi(getChecks);
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger ta vérification."} onRetry={reload} />;
  if (!data) return <Loading label="Chargement de ta vérification..." />;

  if (!data.profession) {
    return (
      <p className="text-[16px] leading-[1.6] text-ink-muted">
        Indique d&apos;abord ton métier dans{" "}
        <Link href="/testeur/profil" className="text-accent underline underline-offset-4">
          ton profil
        </Link>
        .
      </p>
    );
  }

  const status = checkStatusView(data);
  const canSend = data.status === null || data.status === "rejected";
  return (
    <div className="flex flex-col gap-8">
      {data.status && (
        <div className="flex flex-col items-start gap-3">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          <p className="max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">{status.help}</p>
        </div>
      )}
      {canSend && (
        <ProofForm
          overview={data}
          submitLabel="Envoyer ma pièce"
          onSubmit={async (form) => {
            await submitCheck(form);
            router.push("/testeur");
          }}
        />
      )}
    </div>
  );
}
