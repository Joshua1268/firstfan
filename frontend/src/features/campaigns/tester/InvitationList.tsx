"use client";

import Link from "next/link";
import { formatXof } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { ChevronIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { StatusPill } from "@/ui/StatusPill";
import { getTesterInvitations } from "../api";
import { TESTER_STATUS } from "../status";
import type { TesterInvitationSummary } from "../types";
import { audienceLabel } from "../audience";

const h2Cls = "text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink";

export function InvitationList() {
  const { data: invitations, error, reload } = useApi(getTesterInvitations);
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger tes invitations."} onRetry={reload} />;
  if (!invitations) return <Loading label="Chargement de tes invitations..." />;

  if (invitations.length === 0) {
    return (
      <section className="rounded-[var(--radius-card)] border border-dashed border-line p-6 md:p-8">
        <h2 className={h2Cls}>Aucune invitation pour l&apos;instant</h2>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">
          Quand un développeur t&apos;invite à tester son app, l&apos;invitation apparaît ici avec le parcours à suivre.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="tester-invitations" className="flex flex-col gap-5">
      <h2 id="tester-invitations" className={h2Cls}>
        Mes invitations
      </h2>
      <ul className="flex flex-col gap-3">
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <InvitationCard invitation={invitation} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function InvitationCard({ invitation }: { invitation: TesterInvitationSummary }) {
  const status = TESTER_STATUS[invitation.status];
  const steps = `${invitation.steps_total} étape${invitation.steps_total > 1 ? "s" : ""}`;
  const progress = invitation.status === "accepted" ? `${invitation.steps_done} sur ${steps}` : steps;

  return (
    <Link
      href={`/testeur/invitations/${invitation.id}`}
      className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 transition-colors duration-150 hover:border-ink/40 md:p-6"
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <span className="text-[18px] font-semibold leading-snug text-ink [overflow-wrap:anywhere]">
          {invitation.project_name}
        </span>
        <span className="text-[14px] text-ink-muted">
          {audienceLabel(invitation.target_profession)} · {progress} · {formatXof(invitation.reward_xof)}
        </span>
      </div>
      <ChevronIcon
        size={20}
        className="shrink-0 -rotate-90 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  );
}
