"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { formatXof } from "@/lib/money";
import { CheckIcon, ClockIcon, LockIcon } from "@/ui/icons";
import type { TesterInvitationDetail } from "../types";

// Where a finished invitation stands: sent and waiting, paid, refused by the dev, or declined.
export function TestSummary({ invitation, focusTitle }: { invitation: TesterInvitationDetail; focusTitle: boolean }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);

  const summary = SUMMARIES[invitation.status] ?? SUMMARIES.submitted;
  return (
    <section className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
      <span
        className={`flex size-12 items-center justify-center rounded-full ${summary.done ? "bg-accent text-accent-ink" : "border border-line text-ink"}`}
      >
        {summary.icon}
      </span>
      <h2
        ref={titleRef}
        tabIndex={-1}
        className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink focus:outline-none"
      >
        {summary.title}
      </h2>
      <p className="max-w-[46ch] text-[16px] leading-[1.6] text-ink-muted">{summary.text(invitation)}</p>
      <Link
        href="/testeur"
        className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent underline-offset-4 hover:underline"
      >
        Retour à mes invitations
      </Link>
    </section>
  );
}

// Keyed by invitation status; "sent" and "accepted" never reach this screen.
const SUMMARIES: Record<
  string,
  { title: string; icon: ReactNode; done: boolean; text: (i: TesterInvitationDetail) => string }
> = {
  submitted: {
    title: "Test envoyé",
    icon: <ClockIcon size={24} />,
    done: false,
    text: () => "En attente de validation par le dev.",
  },
  validated: {
    title: "Test validé",
    icon: <CheckIcon size={24} strokeWidth={2} />,
    done: true,
    text: (i) => `Rémunération créditée (${formatXof(i.reward_xof)}) : tu peux la retirer dans Mes gains.`,
  },
  rejected: {
    title: "Test refusé",
    icon: <LockIcon size={24} />,
    done: false,
    text: () => "Test refusé par le dev.",
  },
  declined: {
    title: "Invitation refusée",
    icon: <LockIcon size={24} />,
    done: false,
    text: () => "Tu as refusé cette invitation.",
  },
};
