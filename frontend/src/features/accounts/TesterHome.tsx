"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { ArrowIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { StatusPill } from "@/ui/StatusPill";
import { getMe, getTesterProfile } from "./api";
import type { Verification } from "./types";

const VERIFICATION: Record<Verification, { tone: "waiting" | "success" | "danger"; label: string; help: string }> = {
  pending: {
    tone: "waiting",
    label: "En attente de vérification",
    help: "Nous vérifions ton métier. Tu recevras des invitations dès qu'il sera confirmé.",
  },
  verified: {
    tone: "success",
    label: "Métier vérifié",
    help: "Ton badge est actif : les développeurs de ton secteur peuvent t'inviter.",
  },
  rejected: {
    tone: "danger",
    label: "Refusé",
    help: "Nous n'avons pas pu vérifier ton métier. Mets à jour ton profil avec un autre justificatif.",
  },
};

const INCOMPLETE = {
  tone: "waiting",
  label: "Profil incomplet",
  help: "Ajoute ton métier, ton numéro mobile money et ton LinkedIn ou un justificatif pour qu'on vérifie ton métier.",
} as const;

async function loadHome() {
  const [me, profile] = await Promise.all([getMe(), getTesterProfile()]);
  return { me, profile };
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

  // Nothing can be checked before the profile is complete: say what is missing instead.
  const status = data.me.profile_complete ? VERIFICATION[data.profile.verification] : INCOMPLETE;
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-start gap-4">
        <SpaceTitle>Bonjour {data.me.first_name}</SpaceTitle>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <p className="max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">{status.help}</p>
        <Link
          href="/testeur/profil"
          className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent"
        >
          Modifier mon profil
          <ArrowIcon size={18} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </section>

      {children}
    </div>
  );
}
