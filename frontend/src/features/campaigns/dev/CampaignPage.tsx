"use client";

import Link from "next/link";
import { formatXof } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { NotFoundNotice } from "@/ui/NotFoundNotice";
import { StatusPill } from "@/ui/StatusPill";
import { getCampaign } from "../api";
import { CAMPAIGN_STATUS } from "../status";
import type { CampaignDetail } from "../types";

export function CampaignPage({ campaignId }: { campaignId: number }) {
  const { data: campaign, error, reload } = useApi(() => getCampaign(campaignId));
  if (error?.status === 404) {
    return <NotFoundNotice message="Campagne introuvable." backHref="/dev" backLabel="Retour à tes projets" />;
  }
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger la campagne."} onRetry={reload} />;
  if (!campaign) return <Loading label="Chargement de la campagne..." />;

  const status = CAMPAIGN_STATUS[campaign.status];
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col items-start gap-3">
        <Link
          href={`/dev/projets/${campaign.project.id}`}
          className="inline-flex min-h-11 items-center text-[15px] text-ink-muted hover:text-ink"
        >
          {campaign.project.name}
        </Link>
        <SpaceTitle>{campaign.target_profession}</SpaceTitle>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          {campaign.is_demo && <StatusPill tone="waiting">Données de démo</StatusPill>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-w-0 flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
          <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
            Scénario de test
          </h2>
          <ol
            aria-label="Étapes du scénario"
            className="list-decimal space-y-4 pl-6 marker:font-mono marker:text-[13px] marker:text-ink-muted"
          >
            {campaign.steps.map((step) => (
              <li key={step.order} className="pl-2 text-[16px] leading-[1.6] text-ink [overflow-wrap:anywhere]">
                {step.instruction}
              </li>
            ))}
          </ol>
        </section>
        <PriceSummary campaign={campaign} />
      </div>

      {/* Blocks that depend on the status (tester choice, payment, live follow-up) come here. */}
    </div>
  );
}

function PriceSummary({ campaign }: { campaign: CampaignDetail }) {
  return (
    <section className="flex flex-col gap-4 self-start rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
      <h2 className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">Budget</h2>
      <dl className="flex flex-col gap-3 text-[15px]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Prix par testeur</dt>
          <dd className="text-ink">{formatXof(campaign.price_per_tester_xof)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Testeurs</dt>
          <dd className="text-ink">{campaign.testers_wanted}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <dt className="font-medium text-ink">Total</dt>
          <dd data-testid="campaign-total" className="font-display text-[28px] font-extrabold text-accent">
            {formatXof(campaign.total_xof)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
