"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { ArrowIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { StatusPill } from "@/ui/StatusPill";
import { getChecks, getMe } from "./api";
import { INCOMPLETE, checkStatusView } from "./check-status";

async function loadHome() {
  const [me, checks] = await Promise.all([getMe(), getChecks()]);
  return { me, checks };
}

// children: the balance and the invitation list, given by the page.
export function TesterHome({ children }: { children: ReactNode }) {
  const { data, error, reload } = useApi(loadHome);
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger ton espace."} onRetry={reload} />;
  if (!data) {
    return (
      <p role="status" className="text-[15px] text-ink-muted">
        Chargement...
      </p>
    );
  }

  const status = data.me.profile_complete ? checkStatusView(data.checks) : INCOMPLETE;
  const canSendProof = data.me.profile_complete && (data.checks.status === null || data.checks.status === "rejected");
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-start gap-4">
        <SpaceTitle>Bonjour {data.me.first_name}</SpaceTitle>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <p className="max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">{status.help}</p>
        <div className="flex flex-wrap gap-x-6">
          {canSendProof && <SpaceLink href="/testeur/verification">Faire vérifier mon métier</SpaceLink>}
          <SpaceLink href="/testeur/profil">Modifier mon profil</SpaceLink>
        </div>
      </section>

      {children}
    </div>
  );
}

function SpaceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
      {children}
      <ArrowIcon size={18} className="transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}
