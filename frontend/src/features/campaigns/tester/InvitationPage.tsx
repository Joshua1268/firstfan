"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { BackLink } from "@/ui/BackLink";
import { ArrowIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { NotFoundNotice } from "@/ui/NotFoundNotice";
import { StatusPill } from "@/ui/StatusPill";
import { getTesterInvitation } from "../api";
import { currentStepIndex } from "../progress";
import { TESTER_STATUS } from "../status";
import type { TesterInvitationDetail } from "../types";
import { FinalFeedback } from "./FinalFeedback";
import { GuidedStep } from "./GuidedStep";
import { NdaStep } from "./NdaStep";
import { StepTrail } from "./StepTrail";
import { TestSummary } from "./TestSummary";
import { audienceLabel } from "../audience";

export function InvitationPage({ invitationId }: { invitationId: number }) {
  const { data: invitation, error, reload } = useApi(() => getTesterInvitation(invitationId));
  // Moving to the next screen after an action brings the keyboard focus to its title.
  const [acted, setActed] = useState(false);

  if (error?.status === 404) {
    return <NotFoundNotice message="Invitation introuvable." backHref="/testeur" backLabel="Retour à ton espace" />;
  }
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger l'invitation."} onRetry={reload} />;
  if (!invitation) return <Loading label="Chargement de l'invitation..." />;

  function refresh() {
    setActed(true);
    reload();
  }

  const status = TESTER_STATUS[invitation.status];
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8">
      <header className="flex flex-col items-start gap-3">
        <BackLink href="/testeur">Mes invitations</BackLink>
        <p className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
          {audienceLabel(invitation.target_profession)}
        </p>
        <SpaceTitle>{invitation.project_name}</SpaceTitle>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </header>

      {invitation.status === "sent" && <NdaStep invitation={invitation} onDone={refresh} />}
      {invitation.status === "accepted" && <GuidedTest invitation={invitation} acted={acted} onSaved={refresh} />}
      {!["sent", "accepted"].includes(invitation.status) && <TestSummary invitation={invitation} focusTitle={acted} />}
    </div>
  );
}

function GuidedTest({
  invitation,
  acted,
  onSaved,
}: {
  invitation: TesterInvitationDetail;
  acted: boolean;
  onSaved: () => void;
}) {
  // A done step the tester chose to edit; otherwise the first step without a proof.
  const [opened, setOpened] = useState<number | null>(null);
  const [moved, setMoved] = useState(false);
  const current = currentStepIndex(invitation.steps);
  const shown = opened ?? current;

  function open(index: number) {
    setOpened(index === current ? null : index);
    setMoved(true);
  }

  function saved() {
    setOpened(null);
    onSaved();
  }

  return (
    <div className="flex flex-col gap-6">
      {invitation.test_url && (
        <a
          href={invitation.test_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill border border-ink/70 px-7 text-[16px] font-semibold text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.07] md:w-auto md:self-start"
        >
          Ouvrir l&apos;app
          <ArrowIcon size={20} className="-rotate-45 transition-transform duration-150 group-hover:translate-x-0.5" />
        </a>
      )}
      <StepTrail steps={invitation.steps} shown={shown} onOpen={open} />
      {shown === null ? (
        <FinalFeedback invitationId={invitation.id} focusTitle={acted || moved} onSent={onSaved} onConflict={onSaved} />
      ) : (
        <GuidedStep
          key={invitation.steps[shown].order}
          invitationId={invitation.id}
          step={invitation.steps[shown]}
          number={shown + 1}
          total={invitation.steps.length}
          focusTitle={acted || moved}
          onSaved={saved}
          onConflict={saved}
        />
      )}
    </div>
  );
}
