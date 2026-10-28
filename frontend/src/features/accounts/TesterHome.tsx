"use client";

import Link from "next/link";
import { SpaceTitle } from "@/ui/AppShell";
import { useApi } from "@/lib/use-api";
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

async function loadHome() {
  const [me, profile] = await Promise.all([getMe(), getTesterProfile()]);
  return { me, profile };
}

export function TesterHome() {
  const { data, error, reload } = useApi(loadHome);
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger ton espace."} onRetry={reload} />;
  if (!data) {
    return (
      <p role="status" className="text-[15px] text-ink-muted">
        Chargement...
      </p>
    );
  }

  const status = VERIFICATION[data.profile.verification];
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-start gap-4">
        <SpaceTitle>Bonjour {data.me.first_name}</SpaceTitle>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <p className="max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">{status.help}</p>
        {!data.me.profile_complete && (
          <p className="max-w-[52ch] text-[16px] leading-[1.6] text-ink">
            Ton profil est incomplet : ajoute ton métier, ton numéro mobile money et ton LinkedIn ou un justificatif.
          </p>
        )}
        <Link
          href="/testeur/profil"
          className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent"
        >
          Modifier mon profil
          <ArrowIcon size={18} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </section>

      <section className="rounded-[var(--radius-card)] border border-dashed border-line p-6 md:p-8">
        <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
          Aucune invitation pour l&apos;instant
        </h2>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">
          Quand un développeur t&apos;invite à tester son app, l&apos;invitation apparaît ici avec le parcours à suivre.
        </p>
      </section>
    </div>
  );
}
