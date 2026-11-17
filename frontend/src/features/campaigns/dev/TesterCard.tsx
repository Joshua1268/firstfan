"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { StarIcon } from "@/ui/icons";
import { StatusPill } from "@/ui/StatusPill";
import { stepsWithProofs } from "../live";
import { INVITATION_STATUS } from "../status";
import type { CampaignDetail, LiveRow } from "../types";
import { FeedbackSummary } from "./FeedbackSummary";
import { ProofList } from "./ProofList";
import { ValidateDialog } from "./ValidateDialog";

const rating = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const OUTCOME: Partial<Record<LiveRow["status"], string>> = {
  sent: "Invitation envoyée, pas encore acceptée.",
  declined: "Le testeur a refusé l'invitation.",
  submitted: "Test terminé : à toi de le valider.",
  validated: "Validé, rémunération créditée.",
  rejected: "Rejeté, sans rémunération.",
};

export function TesterCard({
  row,
  steps,
  onChanged,
}: {
  row: LiveRow;
  steps: CampaignDetail["steps"];
  onChanged: () => void;
}) {
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Hides the button between the decision and the next refresh of the board.
  const [judged, setJudged] = useState(false);
  // A dispute can send a judged test back for review: the button must come back then.
  if (judged && row.status !== "submitted") setJudged(false);
  const canJudge = row.status === "submitted" && !judged;

  // If the opening button is gone, focus the title.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !dialogOpen && !canJudge) titleRef.current?.focus();
    wasOpen.current = dialogOpen;
  }, [dialogOpen, canJudge]);

  const done = row.proofs.length;
  const status = INVITATION_STATUS[row.status];
  const tester = row.tester;

  return (
    <article
      aria-labelledby={`${id}-name`}
      className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 md:p-7"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3
            id={`${id}-name`}
            ref={titleRef}
            tabIndex={-1}
            className="text-[19px] font-semibold text-ink [overflow-wrap:anywhere] focus:outline-none"
          >
            {tester.first_name}
          </h3>
          <p className="flex flex-wrap items-center gap-x-3 text-[14px] text-ink-muted">
            <span>{tester.profession}</span>
            <span className="inline-flex items-center gap-1">
              <StarIcon size={14} className={tester.rating_avg === null ? "" : "text-accent"} />
              {tester.rating_avg === null ? "Pas encore noté" : `${rating.format(tester.rating_avg)} sur 5`}
            </span>
          </p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-[14px] text-ink-muted">
          <span className="font-display text-[22px] font-extrabold text-ink">{done}</span> sur {steps.length}{" "}
          {steps.length > 1 ? "étapes" : "étape"}
        </p>
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-pill bg-line">
          <div
            className={`h-full origin-left rounded-pill transition-transform duration-300 motion-reduce:transition-none ${
              row.status === "rejected" ? "bg-danger" : "bg-accent"
            }`}
            style={{ transform: `scaleX(${steps.length ? done / steps.length : 0})` }}
          />
        </div>
        {OUTCOME[row.status] && <p className="text-[14px] text-ink-muted">{OUTCOME[row.status]}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        {done > 0 ? (
          <ProofList steps={stepsWithProofs(steps, row.proofs)} />
        ) : (
          row.status !== "declined" && (
            <p className="text-[15px] text-ink-muted">Aucune étape faite pour l&apos;instant.</p>
          )
        )}
        <div className="flex flex-col gap-4">
          {row.feedback && <FeedbackSummary feedback={row.feedback} />}
          {row.dev_rating && (
            <p className="flex flex-col gap-1 text-[15px] text-ink">
              <span className="font-medium">Ta note : {row.dev_rating.score} sur 5</span>
              {row.dev_rating.comment && (
                <span className="text-ink-muted [overflow-wrap:anywhere]">{row.dev_rating.comment}</span>
              )}
            </p>
          )}
          {canJudge && (
            <Button onClick={() => setDialogOpen(true)} className="self-stretch">
              Valider et noter
            </Button>
          )}
        </div>
      </div>

      {dialogOpen && (
        <ValidateDialog
          invitationId={row.invitation_id}
          testerName={tester.first_name}
          onClose={() => setDialogOpen(false)}
          onDone={() => {
            setDialogOpen(false);
            setJudged(true);
            onChanged();
          }}
        />
      )}
    </article>
  );
}
