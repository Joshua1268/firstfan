"use client";

import { getChecks } from "@/features/accounts/api";
import { useApi } from "@/lib/use-api";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { getRecruitingCampaigns } from "../api";
import { RecruitingCard } from "./RecruitingCard";

async function loadRecruiting() {
  const [campaigns, checks] = await Promise.all([getRecruitingCampaigns(), getChecks()]);
  return { campaigns, checks };
}

export function RecruitingList() {
  const { data, error, reload } = useApi(loadRecruiting);
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger les campagnes."} onRetry={reload} />;
  if (!data) return <Loading label="Chargement des campagnes ouvertes..." />;
  if (data.campaigns.length === 0) return null;

  return (
    <section aria-labelledby="recruiting-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2
          id="recruiting-title"
          className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink"
        >
          Campagnes ouvertes
        </h2>
        <p className="max-w-[60ch] text-[15px] text-ink-muted">
          Postule à celles qui t&apos;intéressent : le développeur choisit ensuite ses testeurs parmi les candidats.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {data.campaigns.map((campaign) => (
          <li key={campaign.id}>
            <RecruitingCard campaign={campaign} checks={data.checks} onApplied={reload} />
          </li>
        ))}
      </ul>
    </section>
  );
}
