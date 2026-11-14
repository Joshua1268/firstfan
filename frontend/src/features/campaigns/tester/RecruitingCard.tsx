"use client";

import { useState } from "react";
import { ProofForm } from "@/features/accounts/ProofForm";
import type { ChecksOverview } from "@/features/accounts/types";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { formatXof } from "@/lib/money";
import { Button } from "@/ui/Button";
import { FormAlert } from "@/ui/FormAlert";
import { StatusPill } from "@/ui/StatusPill";
import { applyToCampaign } from "../api";
import { audienceLabel } from "../audience";
import type { RecruitingCampaign } from "../types";

export function RecruitingCard({
  campaign,
  checks,
  onApplied,
}: {
  campaign: RecruitingCampaign;
  checks: ChecksOverview;
  onApplied: () => void;
}) {
  const [askProof, setAskProof] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  // A targeted campaign needs a piece, unless one is already valid or being checked.
  const needsProof = Boolean(campaign.target_profession) && (checks.status === null || checks.status === "rejected");
  const steps = `${campaign.steps_total} étape${campaign.steps_total > 1 ? "s" : ""}`;

  async function apply(form: FormData) {
    await applyToCampaign(campaign.id, form);
    onApplied();
  }

  async function applyWithoutProof() {
    setBusy(true);
    setError(undefined);
    try {
      await apply(new FormData());
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 md:p-6">
      <div className="flex flex-col items-start gap-2">
        {campaign.applied && (
          <StatusPill tone={checks.status === "pending" && campaign.target_profession ? "waiting" : "success"}>
            {checks.status === "pending" && campaign.target_profession
              ? "Candidature envoyée · vérification en cours"
              : "Candidature envoyée"}
          </StatusPill>
        )}
        <h3 className="text-[18px] font-semibold leading-snug text-ink [overflow-wrap:anywhere]">
          {campaign.project.name}
        </h3>
        <p className="line-clamp-3 max-w-[60ch] text-[15px] leading-[1.5] text-ink-muted">
          {campaign.project.description}
        </p>
        <p className="text-[14px] text-ink-muted">
          {audienceLabel(campaign.target_profession)} · {steps} · {formatXof(campaign.reward_xof)}
        </p>
      </div>
      {!campaign.applied && !askProof && (
        <div className="flex flex-col gap-3">
          <FormAlert message={formMessage(error)} />
          <Button
            variant="secondary"
            onClick={needsProof ? () => setAskProof(true) : applyWithoutProof}
            busy={busy}
            className="self-stretch md:self-start"
          >
            Postuler
          </Button>
          {needsProof && (
            <p className="text-[14px] text-ink-muted">
              Cette campagne vise ton métier : on te demandera une pièce qui le prouve.
            </p>
          )}
        </div>
      )}
      {!campaign.applied && askProof && (
        <ProofForm overview={checks} submitLabel="Envoyer ma pièce et postuler" onSubmit={apply} />
      )}
    </article>
  );
}
