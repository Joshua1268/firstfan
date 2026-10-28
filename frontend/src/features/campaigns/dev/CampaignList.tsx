"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/dates";
import { useApi } from "@/lib/use-api";
import { ArrowIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { StatusPill } from "@/ui/StatusPill";
import { getProjectCampaigns } from "../api";
import { CAMPAIGN_STATUS } from "../status";

export function CampaignList({ projectId }: { projectId: number }) {
  const { data: campaigns, error, reload } = useApi(() => getProjectCampaigns(projectId));
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger les campagnes."} onRetry={reload} />;
  if (!campaigns) return <Loading label="Chargement des campagnes..." />;
  if (campaigns.length === 0) {
    return (
      <p className="text-[15px] text-ink-muted">Aucune campagne pour ce projet : prépare ton scénario ci-dessous.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {campaigns.map((c) => {
        const status = CAMPAIGN_STATUS[c.status];
        return (
          <li key={c.id}>
            <Link
              href={`/dev/campagnes/${c.id}`}
              className="group flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface/60 px-5 py-4 transition-colors duration-150 hover:border-ink/40"
            >
              <span className="text-[17px] font-semibold text-ink">{c.target_profession}</span>
              <span className="text-[14px] text-ink-muted">
                {c.testers_wanted} testeur{c.testers_wanted > 1 ? "s" : ""} · {formatDateTime(c.created_at)}
              </span>
              <span className="ml-auto flex items-center gap-3">
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
                <ArrowIcon
                  size={18}
                  className="text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
