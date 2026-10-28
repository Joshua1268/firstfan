"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, asApiError } from "@/lib/api-client";
import { formatXof } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { Button } from "@/ui/Button";
import { FormAlert } from "@/ui/FormAlert";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { getTesterCandidates, selectTesters, startCheckout } from "../api";
import { selectionCount, toggleTester } from "../selection";
import type { CampaignDetail, TesterCandidate } from "../types";
import { TesterCard } from "./TesterCard";

export function TesterPicker({ campaign }: { campaign: CampaignDetail }) {
  const { data, error, reload } = useApi(() => getTesterCandidates(campaign.id));

  return (
    <section aria-labelledby="picker-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          id="picker-title"
          className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink"
        >
          Choisis tes testeurs
        </h2>
        <p className="max-w-[60ch] text-[15px] text-ink-muted">
          Des professionnels vérifiés du métier {campaign.target_profession}, disponibles maintenant. Les invitations
          partent dès que le paiement est confirmé.
        </p>
      </div>
      {campaign.payment?.status === "failed" && (
        <FormAlert message="Paiement annulé : aucun montant n'a été débité. Tu peux relancer le paiement." />
      )}
      {error ? (
        <LoadFailed message={error.detail ?? "Impossible de charger les testeurs."} onRetry={reload} />
      ) : !data ? (
        <Loading label="Recherche des testeurs disponibles..." />
      ) : data.candidates.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line px-5 py-6 text-[15px] text-ink-muted">
          Aucun testeur vérifié n&apos;est disponible pour ce métier pour l&apos;instant. Reviens un peu plus tard : de
          nouveaux profils sont vérifiés chaque semaine.
        </p>
      ) : (
        <PickerForm campaign={campaign} candidates={data.candidates} />
      )}
    </section>
  );
}

function PickerForm({ campaign, candidates }: { campaign: CampaignDetail; candidates: TesterCandidate[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => candidates.filter((c) => c.selected).map((c) => c.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const full = selected.length >= campaign.testers_wanted;

  async function pay() {
    setBusy(true);
    setError(undefined);
    try {
      await selectTesters(campaign.id, selected);
      const checkout = await startCheckout(campaign.id);
      router.push(checkout.redirect_url);
    } catch (e) {
      setError(asApiError(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ul aria-label="Testeurs disponibles" className="grid gap-3 md:grid-cols-2">
        {candidates.map((tester) => {
          const checked = selected.includes(tester.id);
          return (
            <li key={tester.id}>
              <TesterCard
                tester={tester}
                checked={checked}
                disabled={busy || (full && !checked)}
                onToggle={() => setSelected(toggleTester(selected, tester.id, campaign.testers_wanted))}
              />
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-4 flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 md:flex-row md:items-center md:justify-between">
        <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-3 text-[15px] text-ink-muted">
          <span className="font-display text-[24px] font-extrabold text-ink">
            {selectionCount(selected.length, campaign.testers_wanted)}
          </span>
          testeurs choisis · {formatXof(selected.length * campaign.price_per_tester_xof)}
        </p>
        <Button onClick={pay} busy={busy} disabled={selected.length === 0}>
          Payer et envoyer les invitations
        </Button>
      </div>
      <FormAlert message={error && pickerMessage(error)} />
    </div>
  );
}

// "Testeur non disponible pour cette campagne." comes back under tester_ids.
function pickerMessage(error: ApiError): string {
  return error.detail ?? error.fields.tester_ids?.join(" ") ?? "Une erreur est survenue. Réessaie dans un instant.";
}
