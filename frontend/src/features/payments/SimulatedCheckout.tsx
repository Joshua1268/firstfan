"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { formatXof } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { Button } from "@/ui/Button";
import { FormAlert } from "@/ui/FormAlert";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { NotFoundNotice } from "@/ui/NotFoundNotice";
import { ShieldIcon } from "@/ui/icons";
import { getCampaign } from "@/features/campaigns/api";
import { getPayment, simulatePayment } from "./api";
import { audienceLabel } from "@/features/campaigns/audience";

export function SimulatedCheckout({ reference }: { reference: string }) {
  const router = useRouter();
  const { data: payment, error: loadError, reload } = useApi(() => getPayment(reference));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();

  if (loadError?.status === 404) {
    return <NotFoundNotice message="Paiement introuvable." backHref="/dev" backLabel="Retour à tes projets" />;
  }
  if (loadError)
    return <LoadFailed message={loadError.detail ?? "Impossible de charger le paiement."} onRetry={reload} />;
  if (!payment) return <Loading label="Chargement du paiement..." />;

  const campaignHref = `/dev/campagnes/${payment.campaign_id}`;

  // busy disables both buttons: a double click sends a single request.
  async function finish(outcome: "paid" | "failed") {
    setBusy(true);
    setError(undefined);
    try {
      await simulatePayment(reference, outcome);
      router.push(campaignHref);
    } catch (e) {
      setError(asApiError(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-8">
      <p
        role="note"
        className="flex items-center gap-3 rounded-[var(--radius-label)] border border-accent/60 bg-accent/[0.08] px-4 py-3 text-[15px] font-medium text-ink"
      >
        <ShieldIcon size={20} className="shrink-0 text-accent" />
        Paiement simulé : aucun argent ne circule
      </p>
      <header className="flex flex-col gap-3">
        <SpaceTitle>Paiement</SpaceTitle>
        <CampaignName campaignId={payment.campaign_id} />
        <p className="text-[15px] text-ink-muted">Le prix des testeurs choisis, payé une seule fois.</p>
      </header>
      <dl className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6">
        <dt className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
          Montant à payer
        </dt>
        <dd data-testid="payment-amount" className="font-display text-[40px] font-extrabold leading-none text-accent">
          {formatXof(payment.amount_xof)}
        </dd>
        <dd className="pt-2 font-mono text-[12px] text-ink-muted [overflow-wrap:anywhere]">Réf. {payment.reference}</dd>
      </dl>
      {payment.status === "pending" ? (
        <div className="flex flex-col gap-3 md:flex-row">
          <Button onClick={() => finish("paid")} busy={busy}>
            Confirmer le paiement
          </Button>
          <Button variant="secondary" onClick={() => finish("failed")} busy={busy}>
            Annuler
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p role="status" className="text-[16px] text-ink">
            {payment.status === "paid" ? "Ce paiement est déjà confirmé." : "Ce paiement a été annulé."}
          </p>
          <BackToCampaign href={campaignHref} />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-start gap-3">
          <FormAlert message={formMessage(error)} />
          <BackToCampaign href={campaignHref} />
        </div>
      )}
    </div>
  );
}

function CampaignName({ campaignId }: { campaignId: number }) {
  const { data: campaign } = useApi(() => getCampaign(campaignId));
  if (!campaign) return null;
  return (
    <p className="text-[16px] font-medium text-ink [overflow-wrap:anywhere]">
      {campaign.project.name} · {audienceLabel(campaign.target_profession)}
    </p>
  );
}

function BackToCampaign({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent underline-offset-4 hover:underline"
    >
      Retour à la campagne
    </Link>
  );
}
